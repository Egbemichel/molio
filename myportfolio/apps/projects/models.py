from django.db import models
from apps.core.imagefields import CompressedImageField
from apps.core.devicon import resolve_icon
import json
import logging

logger = logging.getLogger(__name__)


class TechStack(models.Model):
    name = models.CharField(max_length=50)

    # Logo strategy mirrors Skill: a Devicon URL resolved automatically from the
    # name (so GitHub-synced languages and manual adds both get a logo with no
    # upload), with an optional uploaded image as a manual override.
    icon_url = models.URLField(
        max_length=500, blank=True,
        help_text='Auto-filled from Devicon by name on save. Clear it + upload an image to override.',
    )
    image = CompressedImageField(
        upload_to='tech_stack/', blank=True,
        help_text='Optional manual override (used when Devicon has no logo, or the wrong one).',
    )

    def __str__(self):
        return self.name

    @property
    def icon_src(self):
        """URL the site should render: a manual upload wins, else the Devicon URL."""
        if self.image:
            try:
                return self.image.url
            except Exception:
                logger.exception('Could not resolve uploaded TechStack image for %s', self.pk)
        return self.icon_url or ''

    def save(self, *args, **kwargs):
        # Auto-resolve a Devicon logo by name when nothing is set yet. Cached +
        # guarded, so it never slows or breaks a save / GitHub sync.
        if not self.image and not self.icon_url and self.name:
            try:
                match = resolve_icon(self.name)
                if match:
                    self.icon_url = match['url']
            except Exception:
                logger.exception('TechStack icon auto-resolve failed for %s', self.name)
        super().save(*args, **kwargs)

class Category(models.Model):
    name = models.CharField(max_length=100) # e.g., Personal projects
    order = models.IntegerField(default=0)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['order']

    def __str__(self):
        return self.name

    @property
    def short_name(self):
        """First word of the name — a compact label for the narrow rail. The
        full name still lives in the tooltip and the projects still link by id."""
        return (self.name or '').split(' ')[0] or self.name

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
    logo = CompressedImageField(upload_to='projects/logos/', blank=True)
    mockup = CompressedImageField(upload_to='projects/mockups/', blank=True)
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