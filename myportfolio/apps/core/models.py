from django.db import models
from .imagefields import CompressedImageField
import json
import logging

logger = logging.getLogger(__name__)


class Skill(models.Model):
    """A skill shown in the carousel.

    The logo comes from one of two places:
      * `slug` set  -> a Devicon logo served from the CDN (no upload, toggled on
        from the admin catalog picker), or
      * `icon` set  -> a logo you uploaded yourself, for anything not in Devicon.
    `icon_src` resolves whichever is present.
    """
    name = models.CharField(max_length=100)

    # Devicon-backed logo. slug is NULL (not '') for uploaded skills so the
    # unique constraint doesn't collide across them.
    slug = models.SlugField(max_length=100, blank=True, null=True, unique=True,
                            help_text='Devicon slug, e.g. "django". Set by the catalog picker.')
    variant = models.CharField(max_length=50, blank=True,
                               help_text='Devicon SVG variant, e.g. "original" or "plain".')
    icon_url = models.URLField(max_length=500, blank=True,
                               help_text='CDN URL of the Devicon SVG.')

    # Manual fallback for logos Devicon doesn't carry.
    icon = CompressedImageField(upload_to='skills/', blank=True,
                                help_text='Only needed when this skill is not from the catalog.')

    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order', 'name']

    def __str__(self):
        return self.name

    @property
    def icon_src(self):
        """The URL the carousel should render, whichever source supplied it."""
        if self.icon_url:
            return self.icon_url
        if self.icon:
            try:
                return self.icon.url
            except Exception:
                logger.exception('Could not resolve uploaded icon URL for skill %s', self.pk)
        return ''


class Education(models.Model):
    degree = models.CharField(max_length=200)
    school = models.CharField(max_length=200)
    location = models.CharField(max_length=200)
    faculty = models.CharField(max_length=200)
    dates = models.CharField(max_length=100, help_text="e.g., 2023 - 2027")
    is_current = models.BooleanField(default=False)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.degree} - {self.school}"
    
    def get_gallery_images_json(self):
        """Return gallery image URLs as JSON array"""
        images = self.gallery_images.all().order_by('order')
        return json.dumps([img.image.url for img in images])


class EducationGallery(models.Model):
    """Gallery images associated with an education entry"""
    education = models.ForeignKey(Education, on_delete=models.CASCADE, related_name='gallery_images')
    image = CompressedImageField(upload_to='education/')
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']
        verbose_name_plural = 'Education Gallery Items'

    def __str__(self):
        return f"{self.education.school} - Image {self.order}"


class Service(models.Model):
    number = models.IntegerField(unique=True)
    title = models.CharField(max_length=200)
    description = models.TextField()
    image = CompressedImageField(upload_to='services/', blank=True, null=True)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order', 'number']

    def __str__(self):
        return self.title


class GalleryItem(models.Model):
    SPAN_CHOICES = [(1, '1 Column'), (2, '2 Columns')]
    ROW_CHOICES = [(1, '1 Row'), (2, '2 Rows')]

    image = CompressedImageField(upload_to='gallery/')
    alt_text = models.CharField(max_length=200)
    col_span = models.IntegerField(choices=SPAN_CHOICES, default=1)
    row_span = models.IntegerField(choices=ROW_CHOICES, default=1)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.alt_text


class Feedback(models.Model):
    RATING_CHOICES = [(i, f'{i} Star{"s" if i != 1 else ""}') for i in range(1, 6)]

    name = models.CharField(max_length=100, default='Anonymous')
    email = models.EmailField(default='noemail@example.com')
    rating = models.IntegerField(choices=RATING_CHOICES)
    message = models.TextField()
    image = CompressedImageField(upload_to='feedback/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Feedback'

    def __str__(self):
        return f"{self.name} - {self.get_rating_display()} - {self.created_at.strftime('%Y-%m-%d')}"


def cv_file_storage():
    """Store the CV on Cloudinary (raw) in production; default storage elsewhere.
    Callable so dev/CI don't need Cloudinary configured to load the model."""
    from django.conf import settings
    if 'cloudinary_storage' in settings.INSTALLED_APPS:
        from cloudinary_storage.storage import RawMediaCloudinaryStorage
        return RawMediaCloudinaryStorage()
    from django.core.files.storage import default_storage
    return default_storage


class Resume(models.Model):
    """The downloadable CV/résumé. File lives on Cloudinary, row lives in Neon."""
    label = models.CharField(max_length=100, default='CV',
                             help_text='Internal label, e.g. "CV 2026".')
    file = models.FileField(upload_to='cv/', storage=cv_file_storage,
                            help_text='Upload a PDF. Replaces the current downloadable CV.')
    is_active = models.BooleanField(default=True,
                                    help_text='The CV offered for download on the site.')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        verbose_name = 'Resume / CV'
        verbose_name_plural = 'Resume / CV'

    def __str__(self):
        return f'{self.label} ({"active" if self.is_active else "inactive"})'

    def delivery_url(self):
        """A URL a browser can actually open.

        On Cloudinary the CV is stored as a `raw` asset. Cloudinary refuses
        *plain* delivery of PDFs when the account restricts that media type,
        answering `401` with `X-Cld-Error: deny or ACL failure`. A **signed**
        delivery URL is the supported way to serve restricted media, and signing
        an unrestricted asset is harmless — so we always sign on Cloudinary.

        Falls back to the plain storage URL (dev / non-Cloudinary) and never
        raises: a broken CV link must not take the home page down.
        """
        if not self.file:
            return None

        from django.conf import settings
        if 'cloudinary_storage' in settings.INSTALLED_APPS:
            try:
                from cloudinary.utils import cloudinary_url
                # Storage._save() persists Cloudinary's public_id, which is
                # already prefixed (media/…) and, for raw assets, keeps the
                # file extension — so file.name IS the public_id.
                url, _opts = cloudinary_url(
                    self.file.name,
                    resource_type='raw',
                    type='upload',
                    sign_url=True,
                    secure=True,
                )
                return url
            except Exception:
                logger.exception('Could not sign the CV URL; falling back to the plain one')

        try:
            return self.file.url
        except Exception:
            logger.exception('Could not build any CV URL')
            return None

