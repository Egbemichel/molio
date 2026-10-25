"""One-off clean-up for the 2026 relaunch.

    python manage.py launch_prep --dry-run   # show what would change
    python manage.py launch_prep

- Unpublishes every project that isn't one of the seeded design worlds. Nothing
  is deleted: re-publish each from the admin once it has its own world.
- Deletes "Off the clock" photos that aren't the seeded ones (the old Creative
  gallery). This can't be undone.
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.core.management.commands.seed_content import MOMENTS
from apps.core.models import GalleryItem
from apps.projects.models import Project
from apps.projects.seed_data import PROJECTS


class Command(BaseCommand):
    help = 'Hide non-design projects and remove old gallery photos for the relaunch.'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true')

    @transaction.atomic
    def handle(self, *args, dry_run=False, **options):
        seeded_slugs = {p['slug'] for p in PROJECTS}
        seeded_alts = {alt for _, alt, _ in MOMENTS}

        to_hide = Project.objects.filter(published=True).exclude(slug__in=seeded_slugs)
        old_photos = GalleryItem.objects.exclude(alt_text__in=seeded_alts)

        for p in to_hide:
            self.stdout.write(f'unpublish  {p.slug}')
        for g in old_photos:
            self.stdout.write(f'delete     photo "{g.alt_text}" ({g.image.name})')

        if dry_run:
            self.stdout.write(self.style.WARNING('Dry run: nothing changed.'))
            transaction.set_rollback(True)
            return

        hidden = to_hide.update(published=False)
        deleted, _ = old_photos.delete()
        self.stdout.write(self.style.SUCCESS(f'Unpublished {hidden} project(s), deleted {deleted} photo(s).'))
