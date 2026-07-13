from pathlib import Path
from decouple import config as env
from django.templatetags.static import static
from django.urls import reverse_lazy

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = env('SECRET_KEY')

DEBUG = True

ALLOWED_HOSTS = []

INSTALLED_APPS = [
    # Unfold admin theme — must come before django.contrib.admin so its admin
    # templates take precedence.
    "unfold",
    "unfold.contrib.forms",
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

# ── Unfold admin theme ───────────────────────────────────────────────────────
# A redesign only — every model, view and custom feature behaves exactly as
# before. Unfold is responsive out of the box (no hand-rolled media queries).
# The brand accent below (#8B1E1E) drives buttons/links/active states; the
# HagiaPro typeface and the larger, more legible text live in
# static/admin/unfold_overrides.css (loaded via STYLES, admin pages only).
UNFOLD = {
    "SITE_TITLE": "Molio Control Center",
    "SITE_HEADER": "Molio Control Center",
    "SITE_SUBHEADER": "Where the work takes place",
    # Brand mark at the top of the sidebar.
    "SITE_ICON": lambda request: static("images/icon.png"),
    "SHOW_HISTORY": True,
    "SHOW_VIEW_ON_SITE": True,
    "STYLES": [
        lambda request: static("admin/unfold_overrides.css"),
    ],
    # Sidebar search bar (with the ⌘K / Ctrl+K indicator) opens the command
    # palette; search_models makes it jump straight to any app/model.
    "COMMAND": {
        "search_models": True,
        "show_history": True,
    },
    "SIDEBAR": {
        "show_search": True,
        "show_all_applications": True,
        "navigation": [
            {
                "title": "Overview",
                "items": [
                    {"title": "Dashboard", "icon": "dashboard", "link": reverse_lazy("admin:index")},
                ],
            },
            {
                "title": "Content",
                "separator": True,
                "items": [
                    {"title": "Skills", "icon": "code", "link": reverse_lazy("admin:core_skill_changelist")},
                    {"title": "Education", "icon": "school", "link": reverse_lazy("admin:core_education_changelist")},
                    {"title": "Services", "icon": "design_services", "link": reverse_lazy("admin:core_service_changelist")},
                    {"title": "Portfolio", "icon": "photo_library", "link": reverse_lazy("admin:core_galleryitem_changelist")},
                    {"title": "Feedback", "icon": "reviews", "link": reverse_lazy("admin:core_feedback_changelist")},
                    {"title": "Resume / CV", "icon": "description", "link": reverse_lazy("admin:core_resume_changelist")},
                ],
            },
            {
                "title": "Projects",
                "separator": True,
                "items": [
                    {"title": "Projects", "icon": "work", "link": reverse_lazy("admin:projects_project_changelist")},
                    {"title": "Categories", "icon": "category", "link": reverse_lazy("admin:projects_category_changelist")},
                    {"title": "Tech stacks", "icon": "layers", "link": reverse_lazy("admin:projects_techstack_changelist")},
                ],
            },
            {
                "title": "Access",
                "separator": True,
                "collapsible": True,
                "items": [
                    {"title": "Users", "icon": "person", "link": reverse_lazy("admin:auth_user_changelist")},
                    {"title": "Groups", "icon": "group", "link": reverse_lazy("admin:auth_group_changelist")},
                ],
            },
        ],
    },
    # Tailwind-style palettes. Values are "R G B" channel strings (Unfold's
    # format), NOT hex.
    "COLORS": {
        # Brand accent — 600 == #8B1E1E. Shades drive hovers, active states,
        # badges, focus rings, so the accent is used with range, not flatly.
        "primary": {
            "50": "251 244 244",
            "100": "247 230 230",
            "200": "239 201 201",
            "300": "226 160 160",
            "400": "209 107 107",
            "500": "189 66 66",
            "600": "139 30 30",
            "700": "116 27 27",
            "800": "97 26 26",
            "900": "82 26 26",
            "950": "45 11 11",
        },
        # Warm stone neutral instead of Unfold's default cool slate — softer,
        # more editorial surfaces that pair with the maroon accent.
        "base": {
            "50": "250 249 247",
            "100": "244 242 239",
            "200": "231 228 222",
            "300": "212 207 200",
            "400": "168 161 151",
            "500": "124 117 107",
            "600": "90 84 77",
            "700": "68 63 58",
            "800": "44 41 37",
            "900": "28 26 24",
            "950": "18 17 15",
        },
        # Text tones — headings in the brand ink (#3F3F3F), body a touch softer.
        "font": {
            "subtle-light": "124 117 107",
            "subtle-dark": "168 161 151",
            "default-light": "82 78 72",
            "default-dark": "212 207 200",
            "important-light": "63 63 63",
            "important-dark": "250 249 247",
        },
    },
}