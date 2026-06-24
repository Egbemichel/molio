from .base import *
from decouple import config as env, Csv
import dj_database_url
import os

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# DEBUG & SECURITY
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEBUG = False
SECRET_KEY = env('SECRET_KEY')

# Hosts come from the ALLOWED_HOSTS env var (comma-separated). A leading dot
# acts as a wildcard for all subdomains, e.g. ".b4a.run" matches Back4App's
# rotating temporary URLs so a new URL doesn't lock you out.
ALLOWED_HOSTS = env('ALLOWED_HOSTS', default='', cast=Csv())

# Required by Django for the admin/CSRF to work behind HTTPS. A "*.b4a.run"
# wildcard origin is derived from any leading-dot host above.
CSRF_TRUSTED_ORIGINS = [
    f'https://*{host}' if host.startswith('.') else f'https://{host}'
    for host in ALLOWED_HOSTS if host
]

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# HTTPS & SECURITY HEADERS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECURE_SSL_REDIRECT = env('SECURE_SSL_REDIRECT', default=True, cast=bool)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_BROWSER_XSS_FILTER = True

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# MIDDLEWARE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MIDDLEWARE = ['whitenoise.middleware.WhiteNoiseMiddleware'] + MIDDLEWARE

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# DATABASE  (Neon serverless Postgres via a single DATABASE_URL)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DATABASES = {
    'default': dj_database_url.config(
        default=env('DATABASE_URL'),
        # Neon (serverless) auto-suspends and kills idle connections, so don't
        # hold them open — reconnect per request to avoid AdminShutdown errors.
        conn_max_age=0,
        ssl_require=True,  # Neon requires SSL
    )
}
DATABASES['default']['ATOMIC_REQUESTS'] = True

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# MEDIA (Cloudinary) — user uploads persist across deploys
# STATIC (WhiteNoise) — collected at build time, served by the app
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSTALLED_APPS += ['cloudinary_storage', 'cloudinary']

# The cloudinary SDK auto-reads the CLOUDINARY_URL env var; surface it here too.
CLOUDINARY_STORAGE = {'CLOUDINARY_URL': env('CLOUDINARY_URL')}

STATIC_URL = '/static/'
# Collected into <project>/staticfiles_build/static so Vercel's static-build can
# serve it from /static/* (WhiteNoise also serves from here on Docker hosts).
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles_build', 'static')

STORAGES = {
    'default': {
        'BACKEND': 'cloudinary_storage.storage.MediaCloudinaryStorage',
    },
    'staticfiles': {
        # Non-manifest: compresses + serves static files, but a missing/edge-case
        # reference can't hard-crash a page the way ManifestStaticFilesStorage does.
        'BACKEND': 'whitenoise.storage.CompressedStaticFilesStorage',
    },
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# EMAIL CONFIGURATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = env('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = env('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = True
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL', default='noreply@molio.com')

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# LOGGING (optional but recommended)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}
