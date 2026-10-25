"""Load the design projects (each with its own world) and the "Off the clock"
photos into the database.

    python manage.py seed_content --settings=config.settings.dev
    python manage.py seed_content --refresh      # rebuild the seeded projects

Words and world settings live in apps/projects/seed_data.py; images in
apps/projects/seed_assets/<slug>/. Afterwards it is all ordinary admin content.
Re-running is safe: projects that already have chapters and photos (by alt text)
are kept unless --refresh is passed. A project that exists without chapters (say,
a GitHub-synced draft with the same slug) is filled in rather than duplicated.
"""
from pathlib import Path

from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand

from apps.core.models import GalleryItem
from apps.projects.models import Category, ChapterMedia, Project, ProjectChapter
from apps.projects.seed_data import PROJECTS

ASSETS = Path(settings.BASE_DIR) / 'apps' / 'projects' / 'seed_assets'
PHOTOS = Path(settings.BASE_DIR) / 'static' / 'brand' / 'photos'

CATEGORIES = ['Brand identity', 'Fullstack', 'Frontend']

# Only photos of Mich alone. Captions are first drafts; edit them in the admin.
MOMENTS = [
    ('sky-composed.webp', 'Mich looking into the distance against a blue sky', 'Composed. For about four seconds.'),
    ('orange-laugh.webp', 'Mich laughing in an orange hoodie and a cap', 'The four seconds are up.'),
    ('mid-idea.webp', 'Mich with his hand on his forehead, deep in thought', 'Mid-idea. Please hold.'),
    ('late-laptop.webp', 'Mich working on a laptop at night', 'Where most of the work actually happens.'),
    ('sky-walk.webp', 'Mich standing outside under a bright sky', 'Checking the sky for ideas. It mostly sends clouds.'),
    ('window-phone.webp', 'Mich reading his phone by a window', 'Reading the error message twice before blaming the framework.'),
    ('orange-desk.webp', 'Mich at his desk in an orange hoodie', 'Same hoodie, different deadline.'),
    ('event-wall.webp', 'Mich posing in front of an event sponsor wall', 'Events: one serious photo, one silly one. Always both.'),
]


def attach(field, path):
    with open(path, 'rb') as fh:
        field.save(path.name, File(fh), save=False)


class Command(BaseCommand):
    help = 'Load the design projects and "Off the clock" photos.'

    def add_arguments(self, parser):
        parser.add_argument('--refresh', action='store_true', help='Delete and recreate the seeded projects.')

    def handle(self, *args, refresh=False, **options):
        cats = {}
        for order, name in enumerate(CATEGORIES):
            cats[name], _ = Category.objects.get_or_create(name=name, defaults={'order': order})

        for order, data in enumerate(PROJECTS):
            slug = data['slug']
            if refresh:
                Project.objects.filter(slug=slug).delete()
            existing = Project.objects.filter(slug=slug).first()
            if existing and existing.chapters.exists():
                self.stdout.write(f'kept     project  {data["title"]}')
                continue

            folder = ASSETS / slug
            fields = dict(
                title=data['title'], category=cats[data['category']], order=order, published=True,
                role=data.get('role', ''), date_range=data.get('date_range', ''), aside=data.get('aside', ''),
                hook=data.get('hook', ''), description=data.get('description', ''),
                starting_point=data.get('starting_point', ''), outcome=data.get('outcome', ''),
                palette=data.get('palette', []), world_css=data.get('css', '').strip(),
                **data.get('world', {}),
            )
            if existing:
                # e.g. an unpublished draft from the GitHub sync: give it its world
                # and story, keep its GitHub link, languages and sync metadata.
                project = existing
                for name, value in fields.items():
                    setattr(project, name, value)
                verb = 'filled '
            else:
                project = Project(slug=slug, **fields)
                verb = 'created'
            if data.get('mockup'):
                attach(project.mockup, folder / data['mockup'])
            if data.get('logo'):
                attach(project.logo, folder / data['logo'])
            project.save()

            for i, (title, kicker, layout, body, media) in enumerate(data['chapters']):
                chapter = ProjectChapter.objects.create(
                    project=project, title=title, kicker=kicker, layout=layout, body=body, order=i,
                )
                for j, (filename, kind, alt, caption) in enumerate(media):
                    item = ChapterMedia(chapter=chapter, kind=kind, alt=alt, caption=caption, order=j)
                    attach(item.file, folder / filename)
                    item.save()
            self.stdout.write(f'{verb}  project  {project.title}')

        for order, (filename, alt, caption) in enumerate(MOMENTS):
            if GalleryItem.objects.filter(alt_text=alt).exists():
                continue
            item = GalleryItem(alt_text=alt, caption=caption, order=order)
            attach(item.image, PHOTOS / filename)
            item.save()
            self.stdout.write(f'created  photo    {filename}')

        self.stdout.write(self.style.SUCCESS('Content ready.'))
