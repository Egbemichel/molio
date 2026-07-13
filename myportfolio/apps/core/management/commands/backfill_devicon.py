"""
Give existing TechStacks (and any logo-less Skills) a Devicon logo by name.

New records auto-resolve on save, so this is only for rows created before that
existed. Idempotent — run it as many times as you like.

    python manage.py backfill_devicon          # fill anything missing a logo
    python manage.py backfill_devicon --dry-run # just report what would change
"""

from django.core.management.base import BaseCommand

from apps.core.devicon import resolve_icon
from apps.core.models import Skill
from apps.projects.models import TechStack


class Command(BaseCommand):
    help = 'Backfill Devicon logos for TechStacks and logo-less Skills by name.'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true',
                            help='Report matches without saving.')

    def handle(self, *args, **options):
        dry = options['dry_run']

        # TechStacks with neither an uploaded image nor a resolved URL.
        techs = [t for t in TechStack.objects.all() if not t.image and not t.icon_url]
        # Skills with no logo of any kind (catalog or upload).
        skills = [s for s in Skill.objects.all() if not s.icon_url and not s.icon]

        self.stdout.write(f'TechStacks missing a logo: {len(techs)}')
        self.stdout.write(f'Skills missing a logo:     {len(skills)}\n')

        matched = unmatched = 0

        for tech in techs:
            item = resolve_icon(tech.name)
            if item:
                matched += 1
                self.stdout.write(self.style.SUCCESS(f'  TechStack "{tech.name}" -> {item["slug"]}'))
                if not dry:
                    tech.icon_url = item['url']
                    tech.save(update_fields=['icon_url'])
            else:
                unmatched += 1
                self.stdout.write(self.style.WARNING(f'  TechStack "{tech.name}" -> no Devicon match'))

        for skill in skills:
            item = resolve_icon(skill.name)
            if item:
                matched += 1
                self.stdout.write(self.style.SUCCESS(f'  Skill "{skill.name}" -> {item["slug"]}'))
                if not dry:
                    skill.slug = item['slug']
                    skill.variant = item['variant']
                    skill.icon_url = item['url']
                    skill.save(update_fields=['slug', 'variant', 'icon_url'])
            else:
                unmatched += 1
                self.stdout.write(self.style.WARNING(f'  Skill "{skill.name}" -> no Devicon match'))

        verb = 'Would update' if dry else 'Updated'
        self.stdout.write(f'\n{verb} {matched} logo(s); {unmatched} had no confident match.')
        if unmatched and not dry:
            self.stdout.write('Unmatched items keep working - upload a logo manually for those.')
