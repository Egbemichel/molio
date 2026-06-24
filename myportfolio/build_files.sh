#!/usr/bin/env bash
# Vercel build step: install Python deps and collect static assets so the
# @vercel/static-build output (staticfiles_build/) can serve them from /static/.
# The Tailwind CSS is already pre-compiled and committed (static/dist/css/main.css).
set -e

pip install -r requirements.txt
python manage.py collectstatic --noinput --clear
