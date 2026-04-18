import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.prod')
django.setup()

from django.contrib.auth.models import User

username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'mike')
password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', '1234')
email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'egbemichel39@gmail.com')

if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username, email, password)
    print(f'Superuser "{username}" created.')
else:
    print(f'Superuser "{username}" already exists, skipping.')