"""Render the public site to plain files for Cloudflare Pages.

    python manage.py build_static --settings=config.settings.static

Output (default `dist/`):
    index.html        the home page, rendered from the database
    404.html          Pages serves this for unknown URLs
    feedback.json     what the feedback carousel reads (was /api/feedback/get/)
    static/           collected static assets (admin assets excluded)
    _headers          cache rules for Pages
"""
import json
import shutil
from pathlib import Path

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
from django.template.loader import render_to_string
from django.test import Client

from apps.core.models import Feedback

HEADERS = """\
/static/*
  Cache-Control: public, max-age=3600

/static/fonts/*
  Cache-Control: public, max-age=31536000, immutable

/static/images/*
  Cache-Control: public, max-age=86400

/index.html
  Cache-Control: public, max-age=0, must-revalidate

/feedback.json
  Cache-Control: public, max-age=300
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

        response = Client().get('/', HTTP_HOST='localhost')
        if response.status_code != 200:
            raise CommandError(f'Home page rendered with status {response.status_code}')
        (out_dir / 'index.html').write_bytes(response.content)

        (out_dir / '404.html').write_text(render_to_string('404.html'), encoding='utf-8')

        feedback = [
            {
                'id': f.id,
                'name': f.name,
                'rating': f.rating,
                'message': f.message,
                'image': f.image.url if f.image else None,
                'created_at': f.created_at.isoformat(),
                'rating_display': f.get_rating_display(),
            }
            for f in Feedback.objects.all()[:50]
        ]
        (out_dir / 'feedback.json').write_text(json.dumps({'feedback': feedback}), encoding='utf-8')
        (out_dir / '_headers').write_text(HEADERS, encoding='utf-8')

        self.stdout.write(self.style.SUCCESS(f'Static site written to {out_dir}'))
