"""Settings for the static-site build (`manage.py build_static`).

The public site is rendered once from the database into plain files and served
by Cloudflare Pages, so there is no request-time Django. Content still lives in
Postgres (Neon) + Cloudinary and is edited through the admin; this module just
lets the build read it. Only DATABASE_URL and CLOUDINARY_URL differ from dev:
without them the build falls back to local SQLite / local media.

Values pasted into a dashboard often pick up quotes, whitespace or a `psql`
prefix (Neon's copy snippet); they're cleaned up before use.
"""
import os

# The build renders HTML in-process and never serves a request, so no real
# signing key is needed (one is still used if provided).
os.environ.setdefault('SECRET_KEY', 'static-build-only-not-a-secret')

from .base import *  # noqa: E402
import dj_database_url
from django.core.exceptions import ImproperlyConfigured


def _clean_url(name):
    """Read a connection URL from the environment, tolerating paste artefacts.
    Never echoes the value: these are credentials."""
    value = os.environ.get(name, '').strip()
    if value.startswith('psql '):
        value = value[5:].strip()
    value = value.strip('\'"').strip()
    if value and '://' not in value:
        raise ImproperlyConfigured(
            f'{name} is set but is not a URL (expected something like scheme://...). '
            f'Re-paste it in the host settings: the value only, no quotes or command.'
        )
    if value:
        os.environ[name] = value  # libraries (cloudinary) read it from here too
    return value


DEBUG = False
ALLOWED_HOSTS = ['*']  # the build talks to Django in-process, never over a socket

_database_url = _clean_url('DATABASE_URL')
if _database_url:
    DATABASES = {'default': dj_database_url.parse(_database_url, conn_max_age=0, ssl_require=True)}

_cloudinary_url = _clean_url('CLOUDINARY_URL')
if _cloudinary_url:
    INSTALLED_APPS += ['cloudinary_storage', 'cloudinary']
    CLOUDINARY_STORAGE = {'CLOUDINARY_URL': _cloudinary_url}
    STORAGES = {
        'default': {'BACKEND': 'cloudinary_storage.storage.MediaCloudinaryStorage'},
        'staticfiles': {'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage'},
    }
