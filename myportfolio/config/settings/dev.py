from .base import *

DEBUG = True
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Print emails to the console locally instead of sending real SMTP.
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
