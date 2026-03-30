from django.db import models

class TechStack(models.Model):
    name = models.CharField(max_length=50)
    # This will hold the logo (Flutter, Django, etc.)
    image = models.ImageField(upload_to='tech_stack/')

    def __str__(self):
        return self.name

class Category(models.Model):
    name = models.CharField(max_length=100) # e.g., Personal projects
    order = models.IntegerField(default=0)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['order']

    def __str__(self):
        return self.name

class Project(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='projects', null=True,
        blank=True)
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    role = models.CharField(max_length=200, help_text="e.g. Fullstack Developer - RunAm")
    date_range = models.CharField(max_length=100, help_text="e.g. Nov 2025 - present", blank=False)
    description = models.TextField()
    
    # Store points as a list: ["Built X", "Implemented Y"]
    points = models.JSONField(default=list, help_text="Enter as a list of strings")
    
    # Assets
    logo = models.ImageField(upload_to='projects/logos/')
    mockup = models.ImageField(upload_to='projects/mockups/', blank=True)
    github_link = models.URLField(blank=True)

    technologies = models.ManyToManyField(TechStack, blank=True)
    
    # Control
    featured = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order', '-created_at']

    def __str__(self):
        return self.title