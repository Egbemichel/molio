from django.db import models
import json


class Skill(models.Model):
    name = models.CharField(max_length=100)
    icon = models.ImageField(upload_to='skills/')
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.name


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
    image = models.ImageField(upload_to='education/')
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
    image = models.ImageField(upload_to='services/', blank=True, null=True)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order', 'number']

    def __str__(self):
        return self.title


class GalleryItem(models.Model):
    SPAN_CHOICES = [(1, '1 Column'), (2, '2 Columns')]
    ROW_CHOICES = [(1, '1 Row'), (2, '2 Rows')]

    image = models.ImageField(upload_to='gallery/')
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
    image = models.ImageField(upload_to='feedback/', blank=True, null=True)
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

