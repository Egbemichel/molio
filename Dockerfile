# ── Stage 1: build Tailwind CSS (static/dist/css/main.css) ───────────
FROM node:20-slim AS assets
WORKDIR /assets
COPY myportfolio/package.json myportfolio/package-lock.json ./
RUN npm install
# Tailwind scans templates + src/js (see tailwind.config.js content globs),
# so they must be present for the build to emit the right classes.
COPY myportfolio/tailwind.config.js ./
COPY myportfolio/static ./static
COPY myportfolio/templates ./templates
RUN npm run build

# ── Stage 2: Django app ──────────────────────────────────────────────
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

# Bring in the compiled CSS from the assets stage before collectstatic.
COPY --from=assets /assets/static/dist ./static/dist

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
