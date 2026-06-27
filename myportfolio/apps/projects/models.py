from django.db import models
import json


class TechStack(models.Model):
    name = models.CharField(max_length=50)
    # This will hold the logo (Flutter, Django, etc.).
    # blank=True so GitHub-synced languages can be auto-created without an icon
    # (you add the icon later).
    image = models.ImageField(upload_to='tech_stack/', blank=True)

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
    # role / date_range / logo are blank=True so a GitHub-synced draft can be
    # saved before you fill in the human-curated parts.
    role = models.CharField(max_length=200, help_text="e.g. Fullstack Developer - RunAm", blank=True)
    date_range = models.CharField(max_length=100, help_text="e.g. Nov 2025 - present", blank=True)
    description = models.TextField(blank=True)

    # Store points as a list: ["Built X", "Implemented Y"]
    points = models.JSONField(default=list, help_text="Enter as a list of strings")

    # Assets
    logo = models.ImageField(upload_to='projects/logos/', blank=True)
    mockup = models.ImageField(upload_to='projects/mockups/', blank=True)
    github_link = models.URLField(blank=True)
    live_url = models.URLField(blank=True, help_text="Live demo / homepage URL")

    technologies = models.ManyToManyField(TechStack, blank=True)

    # Control
    featured = models.BooleanField(default=False)
    published = models.BooleanField(
        default=True,
        help_text="Unpublished projects are hidden from the public site. "
                  "GitHub-synced projects start unpublished until you finish them."
    )
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    # ── GitHub sync metadata ──────────────────────────────────────────
    github_repo_id = models.BigIntegerField(
        null=True, blank=True, unique=True,
        help_text="GitHub's stable repo id; links this project to a repo across renames."
    )
    is_github_managed = models.BooleanField(default=False)
    last_synced_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['order', '-created_at']

    def __str__(self):
        return self.title

    @property
    def points_json(self):
        """points as a JSON string, for safe embedding in a template/attribute."""
        return json.dumps(self.points or [])