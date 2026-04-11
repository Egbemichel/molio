from django.db import models


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


class Service(models.Model):
    number = models.IntegerField(unique=True)
    title = models.CharField(max_length=200)
    description = models.TextField()
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

    rating = models.IntegerField(choices=RATING_CHOICES)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Feedback'

    def __str__(self):
        return f"{self.get_rating_display()} - {self.created_at.strftime('%Y-%m-%d')}"

