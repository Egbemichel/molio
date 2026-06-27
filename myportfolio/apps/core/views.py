from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.middleware.csrf import get_token
from django.core.mail import EmailMessage
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.conf import settings
from django.db.models import Prefetch
from apps.projects.models import Project, Category
from apps.core.models import Skill, Education, Service, GalleryItem, Feedback, Resume
from datetime import date
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


def home(request):
    # A project shows on the public site only if it's published AND in a category.
    # (GitHub-synced drafts are unpublished, so they stay hidden.) Only categories
    # that actually have a published project are included, so the carousel never
    # gets an empty/draft-only category.
    published_projects = Project.objects.filter(published=True).prefetch_related('technologies')
    projects = published_projects
    categories = (
        Category.objects
        .filter(projects__published=True)
        .distinct()
        .prefetch_related(Prefetch('projects', queryset=published_projects))
    )
    
    # Calculate age dynamically
    birth_date = date(2005, 8, 20)
    today = date.today()
    age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
    
    # Personal information
    personal_info = [
        {'label': 'Name', 'value': 'Egbe Michel'},
        {'label': 'Date of Birth', 'value': '20/08/2005', 'display_value': f'20/08/2005 ({age} years old)'},
        {'label': 'Email', 'value': 'egbemichel39@gmail.com', 'is_link': True},
        {'label': 'Language', 'value': 'English(Fluent), French(Intermediate)'},
    ]
    
    # Fetch all education entries from database
    education_entries = Education.objects.all()
    education_list = [
        {
            'degree': edu.degree,
            'school': edu.school,
            'location': edu.location,
            'faculty': edu.faculty,
            'dates': edu.dates,
            'is_current': edu.is_current,
            'gallery_images': edu.get_gallery_images_json(),
        }
        for edu in education_entries
    ]
    
    # Fetch skills from database
    skills = Skill.objects.all()
    skills_list = [
        {'name': skill.name, 'icon': skill.icon.url}
        for skill in skills
    ]
    
    # Fetch services from database
    services = Service.objects.all()
    services_list = [
        {
            'number': serv.number,
            'title': serv.title,
            'description': serv.description,
        }
        for serv in services
    ]
    
    # Fetch gallery items from database
    gallery_items = [
        {
            'src': item.image.name,
            'alt': item.alt_text,
            'col_span': item.col_span,
            'row_span': item.row_span
        }
        for item in GalleryItem.objects.all()
    ]
    
    # Social media links
    github_icon = '''<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36" fill="none">
<path d="M14.7222 30.28C9.67462 31.9838 5.46827 30.28 2.94446 25.0278" stroke="#8B1E1E" stroke-width="2.20833" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M14.7222 32.3888V27.6157C14.7222 26.7349 14.993 25.9693 15.4295 25.2778C15.7289 24.8033 15.5239 24.1302 14.983 23.9815C10.5027 22.7498 7.36111 20.7696 7.36111 14.201C7.36111 12.4933 7.92063 10.8878 8.90417 9.49042C9.14894 9.14265 9.27131 8.96878 9.30074 8.81129C9.33015 8.6538 9.27901 8.44827 9.17669 8.03722C8.76029 6.36419 8.78727 4.58761 9.41224 2.98589C9.41224 2.98589 10.7037 2.56512 13.6431 4.40138C14.3142 4.82064 14.6497 5.03027 14.9453 5.07716C15.2407 5.12405 15.6359 5.02582 16.426 4.82938C17.5066 4.56076 18.6201 4.41656 19.875 4.41656C21.1299 4.41656 22.2434 4.56076 23.324 4.82938C24.1141 5.02582 24.5093 5.12405 24.8047 5.07716C25.1004 5.03027 25.4359 4.82064 26.1069 4.40138C29.0464 2.56512 30.3378 2.98589 30.3378 2.98589C30.9628 4.58761 30.9897 6.36419 30.5733 8.03722C30.471 8.44827 30.4198 8.6538 30.4492 8.81129C30.4787 8.96877 30.601 9.14267 30.8459 9.49042C31.8293 10.8878 32.3889 12.4933 32.3889 14.201C32.3889 20.7696 29.2473 22.7498 24.7671 23.9815C24.2262 24.1302 24.0211 24.8033 24.3205 25.2778C24.757 25.9693 25.0278 26.7349 25.0278 27.6157V32.3888" stroke="#8B1E1E" stroke-width="2.20833" stroke-linecap="round" stroke-linejoin="round"/>
</svg>'''
    
    instagram_icon = '''<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36" fill="none">
<path d="M3.68054 17.6663C3.68054 11.0732 3.68054 7.77662 5.72876 5.72839C7.77699 3.68018 11.0735 3.68018 17.6667 3.68018C24.2597 3.68018 27.5563 3.68018 29.6046 5.72839C31.6528 7.77662 31.6528 11.0732 31.6528 17.6663C31.6528 24.2593 31.6528 27.5559 29.6046 29.6042C27.5563 31.6524 24.2597 31.6524 17.6667 31.6524C11.0735 31.6524 7.77699 31.6524 5.72876 29.6042C3.68054 27.5559 3.68054 24.2593 3.68054 17.6663Z" stroke="#8B1E1E" stroke-width="2.20833" stroke-linejoin="round"/>
<path d="M24.2917 17.6665C24.2917 21.3254 21.3256 24.2915 17.6667 24.2915C14.0078 24.2915 11.0417 21.3254 11.0417 17.6665C11.0417 14.0076 14.0078 11.0415 17.6667 11.0415C21.3256 11.0415 24.2917 14.0076 24.2917 17.6665Z" stroke="#8B1E1E" stroke-width="2.20833"/>
<path d="M25.7761 9.56934H25.7621" stroke="#8B1E1E" stroke-width="2.94444" stroke-linecap="round" stroke-linejoin="round"/>
</svg>'''
    
    linkedin_icon = '''<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36" fill="none">
<path d="M10.3055 14.7222V25.0277" stroke="#8B1E1E" stroke-width="2.20833" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M16.1945 19.1388V25.0277M16.1945 19.1388C16.1945 16.6995 18.1718 14.7222 20.6111 14.7222C23.0504 14.7222 25.0278 16.6995 25.0278 19.1388V25.0277M16.1945 19.1388V14.7222" stroke="#8B1E1E" stroke-width="2.20833" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M10.3181 10.3052H10.3041" stroke="#8B1E1E" stroke-width="2.94444" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M3.68054 17.6663C3.68054 11.0732 3.68054 7.77662 5.72876 5.72839C7.77699 3.68018 11.0735 3.68018 17.6667 3.68018C24.2597 3.68018 27.5563 3.68018 29.6046 5.72839C31.6528 7.77662 31.6528 11.0732 31.6528 17.6663C31.6528 24.2593 31.6528 27.5559 29.6046 29.6042C27.5563 31.6524 24.2597 31.6524 17.6667 31.6524C11.0735 31.6524 7.77699 31.6524 5.72876 29.6042C3.68054 27.5559 3.68054 24.2593 3.68054 17.6663Z" stroke="#8B1E1E" stroke-width="2.20833" stroke-linejoin="round"/>
</svg>'''
    
    social_links = [
        {'name': 'GitHub', 'url': 'https://github.com/Egbemichel', 'icon': github_icon},
        {'name': 'Instagram', 'url': 'https://instagram.com/michael_egbe.engr', 'icon': instagram_icon},
        {'name': 'LinkedIn', 'url': 'https://www.linkedin.com/in/egbe-michel-40863a299/', 'icon': linkedin_icon},
    ]
    
    # Active CV/résumé for download (guarded: never 500 if not migrated yet)
    try:
        cv = Resume.objects.filter(is_active=True).order_by('-updated_at').first()
        cv_url = cv.file.url if cv and cv.file else None
        # On Cloudinary, fl_attachment forces a download instead of opening in-tab.
        if cv_url and '/upload/' in cv_url:
            cv_url = cv_url.replace('/upload/', '/upload/fl_attachment/', 1)
    except Exception:
        cv_url = None

    # Contact information
    contact_info = {
        'email': 'egbemichel39@gmail.com',
        'location': 'Yaounde, Cameroon',
    }
    
    return render(request, 'core/home.html', {
        'projects': projects,
        'categories': categories,
        'age': age,
        'personal_info': personal_info,
        'education_list': education_list,
        'skills_json': json.dumps(skills_list),
        'services': services,
        'services_json': json.dumps(services_list),
        'gallery_items': gallery_items,
        'social_links': social_links,
        'contact_info': contact_info,
        'cv_url': cv_url,
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
            name = data.get('name', '').strip()
            email = data.get('email', '').strip()
            rating = int(data.get('rating', 0))
            message = data.get('message', '').strip()
            image = None
        else:
            name = request.POST.get('name', '').strip()
            email = request.POST.get('email', '').strip()
            rating = int(request.POST.get('rating', 0))
            message = request.POST.get('message', '').strip()
            image = request.FILES.get('image')

        # Validation
        if not name:
            return JsonResponse({'error': 'Name is required'}, status=400)
        
        if not email:
            return JsonResponse({'error': 'Email is required'}, status=400)
        
        if not 1 <= rating <= 5:
            return JsonResponse({'error': 'Rating must be between 1 and 5'}, status=400)

        if not message or len(message) > 500:
            return JsonResponse({'error': 'Message must be between 1 and 500 characters'}, status=400)

        # Create feedback entry
        feedback = Feedback.objects.create(
            name=name,
            email=email,
            rating=rating,
            message=message,
            image=image
        )

        return JsonResponse(
            {'success': True, 'message': 'Thank you for your feedback!', 'id': feedback.id},
            status=201
        )

    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


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


