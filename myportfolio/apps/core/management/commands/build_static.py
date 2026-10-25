"""Render the public site to plain files for Cloudflare Pages.

    python manage.py build_static --settings=config.settings.static

Output (default `dist/`):
    index.html        the home page, rendered from the database
    work/<slug>/      one page per published project
    404.html          Pages serves this for unknown URLs
    static/           collected static assets (admin assets excluded)
    _headers          cache rules for Pages
"""
import shutil
from pathlib import Path

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
from django.template.loader import render_to_string
from django.test import Client

from apps.core.views import _published_projects

HEADERS = """\
/static/*
  Cache-Control: public, max-age=3600

/static/fonts/*
  Cache-Control: public, max-age=31536000, immutable

/static/images/*
  Cache-Control: public, max-age=86400

/static/brand/*
  Cache-Control: public, max-age=604800

/index.html
  Cache-Control: public, max-age=0, must-revalidate

/work/*
  Cache-Control: public, max-age=0, must-revalidate
"""


class Command(BaseCommand):
    help = 'Render the public site into a static directory for Cloudflare Pages.'

    def add_arguments(self, parser):
        parser.add_argument('--out', default=str(Path(settings.BASE_DIR) / 'dist'))

    def handle(self, *args, out, **options):
        out_dir = Path(out)
        if out_dir.exists():
            shutil.rmtree(out_dir)
        out_dir.mkdir(parents=True)

        # Collect static into dist/static. Admin/Unfold assets are only needed by
        # the admin, which no longer ships with the public site.
        settings.STATIC_ROOT = str(out_dir / 'static')
        call_command(
            'collectstatic', interactive=False, verbosity=0,
            ignore_patterns=['admin', 'unfold', 'src/css', '*.map'],
        )

        # No DATABASE_URL (e.g. a preview build): the fallback is a fresh SQLite
        # file, so give it tables and build an empty-but-valid site. A real
        # database is migrated deliberately (Actions → Production content).
        if settings.DATABASES['default']['ENGINE'].endswith('sqlite3'):
            call_command('migrate', interactive=False, verbosity=0)

        client = Client()
        pages = {'index.html': '/'}
        for project in _published_projects():
            pages[f'work/{project.slug}/index.html'] = project.get_absolute_url()

        for target, url in pages.items():
            response = client.get(url, HTTP_HOST='localhost')
            if response.status_code != 200:
                raise CommandError(f'{url} rendered with status {response.status_code}')
            path = out_dir / target
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(response.content)

        (out_dir / '404.html').write_text(render_to_string('404.html'), encoding='utf-8')
        (out_dir / '_headers').write_text(HEADERS, encoding='utf-8')

        self.stdout.write(self.style.SUCCESS(f'Static site written to {out_dir} ({len(pages)} pages)'))
