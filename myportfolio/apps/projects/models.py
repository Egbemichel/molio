from django.db import models
from apps.core.imagefields import CompressedImageField
from apps.core.devicon import resolve_icon
from django.core.validators import FileExtensionValidator, RegexValidator
from . import worlds
import json
from functools import cached_property
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

HEX = RegexValidator(r'^#[0-9A-Fa-f]{6}$', 'Use a 6-digit hex colour, e.g. #C7F000.')


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

    # Story — what makes a project more than a thumbnail (see ME_THE_BRAND.md §9).
    hook = models.CharField(
        max_length=160, blank=True,
        help_text="One line on the home page: what was interesting about it, not the tech list.",
    )
    starting_point = models.TextField(
        blank=True, help_text="The problem, question or itch the project started from.",
    )
    outcome = models.TextField(
        blank=True, help_text="What came out of it and what you learned. Be honest about prototypes.",
    )

    aside = models.CharField(
        max_length=200, blank=True,
        help_text='A note in your own voice shown with the project, e.g. "she was sooo sweet".',
    )

    # ── World: the project page's own look (see worlds.py) ────────────
    world_preset = models.CharField(
        max_length=20, choices=worlds.PRESET_CHOICES, default='paper',
        help_text='Starting point for the look. Anything filled in below overrides it.',
    )
    world_bg = models.CharField('background', max_length=7, blank=True, validators=[HEX])
    world_fg = models.CharField('text', max_length=7, blank=True, validators=[HEX])
    world_accent = models.CharField('accent', max_length=7, blank=True, validators=[HEX])
    world_muted = models.CharField('surface', max_length=7, blank=True, validators=[HEX])
    world_display_font = models.CharField(
        'display font', max_length=200, blank=True,
        help_text='Google Fonts family spec, e.g. "Anton" or "Cormorant+Garamond:ital,wght@1,500".',
    )
    world_body_font = models.CharField('body font', max_length=200, blank=True)
    world_hero = models.CharField('hero layout', max_length=20, choices=worlds.HERO_CHOICES, default='poster')
    palette = models.JSONField(
        default=list, blank=True,
        help_text='Colours shown in "Specimen" chapters: [{"hex": "#C7F000", "name": "Acid"}, …]',
    )
    world_css = models.TextField(
        'extra CSS', blank=True,
        help_text='Optional CSS for this world only. Selectors are scoped under .world.',
    )

    # Store points as a list: ["Built X", "Implemented Y"]
    points = models.JSONField(default=list, blank=True, help_text="Enter as a list of strings")

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

    def get_absolute_url(self):
        return f'/work/{self.slug}/'

    @cached_property
    def world(self):
        return worlds.resolve(self)

    @property
    def is_design(self):
        name = (self.category.name if self.category else '').lower()
        return any(k in name for k in ('brand', 'design', 'identity', 'graphic'))

    @cached_property
    def cover(self):
        """What represents the project on the home page and its hero:
        the mockup, else the logo (shown whole), else the first chapter photo."""
        if self.mockup:
            return {'url': self.mockup.url, 'kind': 'photo'}
        if self.logo:
            return {'url': self.logo.url, 'kind': 'artwork'}
        for chapter in self.chapters.all():
            for media in chapter.media.all():
                if media.kind == 'photo':
                    return {'url': media.file.url, 'kind': 'photo'}
        return None


class ProjectChapter(models.Model):
    """One step of a project's process, shown in order on the project page.

    Design work follows Mich's workflow — The thought, The brand, The experience;
    dev work tells it as The itch, The rabbit hole, The souvenirs. Each chapter
    picks a layout, so the same three steps play out differently per project.
    """
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='chapters')
    title = models.CharField(max_length=120, help_text='e.g. "The thought"')
    kicker = models.CharField(max_length=160, blank=True, help_text='Optional one-liner under the title.')
    body = models.TextField(blank=True, help_text='For "Pillars", one idea per line: "Title: text".')
    layout = models.CharField(max_length=20, choices=worlds.LAYOUT_CHOICES, default='split')
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f'{self.project.title} — {self.title}'

    @property
    def pillars(self):
        out = []
        for line in self.body.splitlines():
            if not line.strip():
                continue
            head, _, text = line.partition(':')
            out.append({'title': head.strip(), 'text': text.strip()} if text else {'title': '', 'text': head.strip()})
        return out


class ChapterMedia(models.Model):
    """Images (or SVG artwork) inside a chapter."""
    KIND_CHOICES = [('photo', 'Photo / mockup (fills its frame)'), ('artwork', 'Artwork / logo (shown whole)')]

    chapter = models.ForeignKey(ProjectChapter, on_delete=models.CASCADE, related_name='media')
    file = models.FileField(
        upload_to='projects/chapters/',
        validators=[FileExtensionValidator(['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'])],
    )
    kind = models.CharField(max_length=10, choices=KIND_CHOICES, default='photo')
    alt = models.CharField(max_length=200, blank=True)
    caption = models.CharField(max_length=200, blank=True)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']
        verbose_name_plural = 'chapter media'

    def __str__(self):
        return self.alt or self.file.name
