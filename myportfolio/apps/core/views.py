from django.shortcuts import render
from django.http import Http404, JsonResponse
from django.views.decorators.http import require_http_methods
from django.middleware.csrf import get_token
from django.core.mail import EmailMessage
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.conf import settings
from apps.projects.models import Project
from apps.core.models import GalleryItem, Feedback, Resume
from apps.core.imagefields import validate_image_upload
import json
import logging
import requests

logger = logging.getLogger(__name__)


def _deliver_contact_message(name, email, subject, message):
    """Email a contact submission to the site owner.

    Prefers Resend's HTTP API (reliable on serverless hosts like Vercel, where
    SMTP is flaky/blocked). Falls back to Django's email backend (e.g. the
    console backend in dev) when RESEND_API_KEY isn't configured.
    """
    full_subject = f'[Portfolio] {subject or "New message"} — from {name}'
    body = f'Name: {name}\nEmail: {email}\nSubject: {subject or "(none)"}\n\n{message}'

    if settings.RESEND_API_KEY:
        resp = requests.post(
            'https://api.resend.com/emails',
            headers={
                'Authorization': f'Bearer {settings.RESEND_API_KEY}',
                'Content-Type': 'application/json',
            },
            json={
                'from': settings.RESEND_FROM_EMAIL,
                'to': [settings.CONTACT_RECIPIENT_EMAIL],
                'reply_to': email,
                'subject': full_subject,
                'text': body,
            },
            timeout=10,
        )
        if resp.status_code not in (200, 201):
            raise RuntimeError(f'Resend API error {resp.status_code}: {resp.text}')
    else:
        EmailMessage(
            subject=full_subject,
            body=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[settings.CONTACT_RECIPIENT_EMAIL],
            reply_to=[email],
        ).send(fail_silently=False)


SOCIAL_LINKS = [
    {'name': 'GitHub', 'url': 'https://github.com/Egbemichel'},
    {'name': 'LinkedIn', 'url': 'https://www.linkedin.com/in/egbe-michel-40863a299/'},
    {'name': 'Instagram', 'url': 'https://instagram.com/michael_egbe.engr'},
]

CONTACT_EMAIL = 'egbemichel39@gmail.com'


def _published_projects():
    # A project shows on the public site only if it's published AND in a category.
    # (GitHub-synced drafts are unpublished, so they stay hidden.)
    return (
        Project.objects
        .filter(published=True, category__isnull=False)
        .select_related('category')
        .prefetch_related('technologies', 'chapters__media')
    )


def _cv_url():
    # Guarded: never 500 if not migrated yet or storage misbehaves.
    try:
        cv = Resume.objects.filter(is_active=True).order_by('-updated_at').first()
        # Signed Cloudinary URL — a plain one 401s when the account restricts
        # PDF delivery. Opens as an inline preview in a new tab.
        return cv.delivery_url() if cv else None
    except Exception:
        logger.exception('Could not resolve the CV URL')
        return None


def _site_context():
    """What every public page needs: footer links, contact, CV."""
    return {
        'social_links': SOCIAL_LINKS,
        'contact_email': CONTACT_EMAIL,
        'location': 'Yaoundé, Cameroon',
        'cv_url': _cv_url(),
    }


def home(request):
    # Use .url (absolute in production via Cloudinary) — NOT .name behind a
    # hardcoded /media/ prefix, which 404s once storage isn't local.
    moments = [
        {'src': item.image.url, 'alt': item.alt_text, 'caption': item.caption}
        for item in GalleryItem.objects.all()
        if item.image
    ]
    return render(request, 'core/home.html', {
        **_site_context(),
        'projects': _published_projects(),
        'moments': moments,
    })


def project_detail(request, slug):
    projects = list(_published_projects())
    project = next((p for p in projects if p.slug == slug), None)
    if project is None:
        raise Http404('No such project')
    i = projects.index(project)
    return render(request, 'projects/detail.html', {
        **_site_context(),
        'project': project,
        'next_project': projects[(i + 1) % len(projects)] if len(projects) > 1 else None,
    })


@require_http_methods(['POST'])
def contact(request):
    """
    Contact form endpoint: validates the message and emails it to the site owner.
    The visitor's email is set as reply-to so replies go straight to them.
    Expected JSON: { "name", "email", "subject", "message", "company"(honeypot) }
    """
    try:
        if request.content_type == 'application/json':
            data = json.loads(request.body)
        else:
            data = request.POST

        name = (data.get('name') or '').strip()
        email = (data.get('email') or '').strip()
        subject = (data.get('subject') or '').strip()
        message = (data.get('message') or '').strip()
        # Honeypot: real users never fill a hidden "company" field; bots do.
        if (data.get('company') or '').strip():
            return JsonResponse({'success': True, 'message': 'Thanks!'}, status=200)

        if not name:
            return JsonResponse({'error': 'Please enter your name.'}, status=400)
        try:
            validate_email(email)
        except ValidationError:
            return JsonResponse({'error': 'Please enter a valid email address.'}, status=400)
        if not message:
            return JsonResponse({'error': 'Please write a message.'}, status=400)
        if len(message) > 5000:
            return JsonResponse({'error': 'Message is too long.'}, status=400)

        _deliver_contact_message(name, email, subject, message)

        return JsonResponse(
            {'success': True, 'message': "Message sent — I'll get back to you soon."},
            status=200,
        )

    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid request.'}, status=400)
    except Exception:
        logger.exception('Contact email failed to send')
        return JsonResponse(
            {'error': 'Could not send right now. Please email me directly.'},
            status=500,
        )


@require_http_methods(['POST'])
def submit_feedback(request):
    """
    API endpoint to submit feedback form with name, email, rating, message, and optional image
    Expected JSON: { "name": "str", "email": "str", "rating": 1-5, "message": "str", "image": "file" }
    """
    try:
        # Handle both JSON and multipart form data
        if request.content_type == 'application/json':
            data = json.loads(request.body)
            name = (data.get('name') or '').strip()
            email = (data.get('email') or '').strip()
            rating_raw = data.get('rating', 0)
            message = (data.get('message') or '').strip()
            image = None
        else:
            name = request.POST.get('name', '').strip()
            email = request.POST.get('email', '').strip()
            rating_raw = request.POST.get('rating', 0)
            message = request.POST.get('message', '').strip()
            image = request.FILES.get('image')

        # Validation — each returns a specific, human message the UI can toast.
        if not name:
            return JsonResponse({'error': 'Please enter your name.'}, status=400)

        try:
            validate_email(email)
        except ValidationError:
            return JsonResponse({'error': 'Please enter a valid email address.'}, status=400)

        try:
            rating = int(rating_raw)
        except (TypeError, ValueError):
            rating = 0
        if not 1 <= rating <= 5:
            return JsonResponse({'error': 'Please pick a rating from 1 to 5 stars.'}, status=400)

        if not message:
            return JsonResponse({'error': 'Please write a short message.'}, status=400)
        if len(message) > 500:
            return JsonResponse({'error': 'Your message is too long (max 500 characters).'}, status=400)

        # If an image was attached, validate it up front so the visitor gets a
        # precise reason (too big / not an image) instead of a generic failure.
        if image is not None:
            try:
                validate_image_upload(image)
            except ValidationError as ve:
                msg = ve.messages[0] if getattr(ve, 'messages', None) else 'That image could not be used.'
                return JsonResponse({'error': msg}, status=400)

        # Create feedback entry (image is compressed on save by the model field)
        feedback = Feedback.objects.create(
            name=name,
            email=email,
            rating=rating,
            message=message,
            image=image
        )

        return JsonResponse(
            {'success': True, 'message': 'Thank you! Your feedback has been received.', 'id': feedback.id},
            status=201
        )

    except json.JSONDecodeError:
        return JsonResponse({'error': 'We could not read your submission. Please try again.'}, status=400)
    except Exception:
        logger.exception('Feedback submission failed')
        return JsonResponse(
            {'error': 'Something went wrong saving your feedback. Please try again in a moment.'},
            status=500,
        )


@require_http_methods(['GET'])
def get_feedback(request):
    """
    API endpoint to retrieve all feedback entries
    Returns JSON list of feedback with name, email, rating, message, image, and created_at
    """
    try:
        feedback_entries = Feedback.objects.all()[:50]  # Limit to latest 50
        
        feedback_list = [
            {
                'id': f.id,
                'name': f.name,
                'email': f.email,
                'rating': f.rating,
                'message': f.message,
                'image': f.image.url if f.image else None,
                'created_at': f.created_at.isoformat(),
                'rating_display': f.get_rating_display(),
            }
            for f in feedback_entries
        ]
        
        return JsonResponse({'feedback': feedback_list}, status=200)
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


