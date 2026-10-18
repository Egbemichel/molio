"""Settings for the static-site build (`manage.py build_static`).

The public site is rendered once from the database into plain files and served
by Cloudflare Pages, so there is no request-time Django. Content still lives in
Postgres (Neon) + Cloudinary and is edited through the admin; this module just
lets the build read it. Only DATABASE_URL and CLOUDINARY_URL differ from dev:
without them the build falls back to local SQLite / local media.
"""
from .base import *
from decouple import config as env
import dj_database_url

DEBUG = False
ALLOWED_HOSTS = ['*']  # the build talks to Django in-process, never over a socket

_database_url = env('DATABASE_URL', default='')
if _database_url:
    DATABASES = {'default': dj_database_url.parse(_database_url, conn_max_age=0, ssl_require=True)}

_cloudinary_url = env('CLOUDINARY_URL', default='')
if _cloudinary_url:
    INSTALLED_APPS += ['cloudinary_storage', 'cloudinary']
    CLOUDINARY_STORAGE = {'CLOUDINARY_URL': _cloudinary_url}
    STORAGES = {
        'default': {'BACKEND': 'cloudinary_storage.storage.MediaCloudinaryStorage'},
        'staticfiles': {'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage'},
    }
