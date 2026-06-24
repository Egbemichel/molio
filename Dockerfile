# Portable image for the molio Django portfolio.
# Build context is the repo root; the app lives in ./myportfolio.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=config.settings.prod

WORKDIR /app

# libpq runtime is needed by psycopg
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq5 \
    && rm -rf /var/lib/apt/lists/*

COPY myportfolio/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY myportfolio/ .

# Collect static at build time. Dummy env vars let prod settings import without
# real secrets — no DB or Cloudinary call happens during collectstatic.
RUN SECRET_KEY=build-only \
    DATABASE_URL=sqlite:// \
    CLOUDINARY_URL=cloudinary://x:x@x \
    python manage.py collectstatic --no-input

EXPOSE 8000

# Migrate, then serve. Single worker + threads keeps us inside Back4App's
# 256 MB free instance; $PORT is honored if the platform injects it.
CMD python manage.py migrate --no-input && \
    gunicorn config.wsgi:application \
      --bind 0.0.0.0:${PORT:-8000} \
      --workers 1 --threads 4 --timeout 60
