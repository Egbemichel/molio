from pathlib import Path
from decouple import config as env

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = env('SECRET_KEY')

DEBUG = True

ALLOWED_HOSTS = []

INSTALLED_APPS = [
    "admin_interface",  # must be before django.contrib.admin
    "colorfield",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "apps.core",
    "apps.projects",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATICFILES_DIRS = [BASE_DIR / "static"]
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Auth & Login Configuration
LOGIN_REDIRECT_URL = "/admin/"
LOGIN_URL = "/admin/login/"

# Allow larger admin uploads — several images (e.g. an Education gallery) in one
# request. Files over 2.5MB still stream to a temp file rather than memory.
DATA_UPLOAD_MAX_MEMORY_SIZE = 25 * 1024 * 1024      # 25 MB request body
DATA_UPLOAD_MAX_NUMBER_FIELDS = 5000

# Contact form: where contact-form submissions are emailed.
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="noreply@molio.com")
CONTACT_RECIPIENT_EMAIL = env("CONTACT_RECIPIENT_EMAIL", default="egbemichel39@gmail.com")

# Resend HTTP email API — reliable on serverless hosts (Vercel) where SMTP is
# blocked/flaky. When RESEND_API_KEY is empty, the contact view falls back to
# Django's email backend (console in dev).
RESEND_API_KEY = env("RESEND_API_KEY", default="")
RESEND_FROM_EMAIL = env("RESEND_FROM_EMAIL", default="Portfolio <onboarding@resend.dev>")

# GitHub project sync. GITHUB_TOKEN is a read-only PAT (raises the API rate
# limit from 60 to 5000/hr); GITHUB_USERNAME is whose public repos to import.
GITHUB_USERNAME = env("GITHUB_USERNAME", default="Egbemichel")
GITHUB_TOKEN = env("GITHUB_TOKEN", default="")