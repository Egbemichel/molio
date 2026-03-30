#!/bin/bash

# ─────────────────────────────────────────
#  Portfolio Project Scaffold
#  Usage: bash setup_portfolio.sh myportfolio
# ─────────────────────────────────────────

PROJECT_NAME=${1:-portfolio}

echo "🚀 Scaffolding $PROJECT_NAME..."

# ── Root ──────────────────────────────────
mkdir -p $PROJECT_NAME && cd $PROJECT_NAME

# ── Python env & Django ───────────────────
python -m venv .venv
source .venv/bin/activate

pip install django python-decouple pillow whitenoise django-admin-interface -q
pip freeze > requirements.txt

# Bootstrap Django project
django-admin startproject config .

# ── Django Apps ───────────────────────────
mkdir -p apps
for app in core projects blog contact; do
  python manage.py startapp $app apps/$app
done

# ── Directory Structure ───────────────────
mkdir -p \
  config/settings \
  static/src/css \
  static/src/js/components \
  static/dist/css \
  static/dist/js \
  templates/components \
  templates/core \
  templates/projects \
  templates/blog \
  templates/contact \
  media

# ── .env ──────────────────────────────────
cat > .env <<'EOF'
DJANGO_SETTINGS_MODULE=config.settings.dev
SECRET_KEY=change-me-to-a-real-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
EOF

# ── .gitignore ────────────────────────────
cat > .gitignore <<'EOF'
.venv/
__pycache__/
*.pyc
*.pyo
.env
db.sqlite3
media/
static/dist/
node_modules/
staticfiles/
EOF

# ── Split Settings ────────────────────────
# Move default settings to base.py
mv config/settings.py config/settings/base.py 2>/dev/null || true

cat > config/settings/__init__.py <<'EOF'
EOF

# Patch base.py
cat >> config/settings/base.py <<'EOF'

# ── decouple & paths ──────────────────────
from decouple import config as env
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
SECRET_KEY = env('SECRET_KEY', default='insecure-default-key')

INSTALLED_APPS += [
    'django_admin_interface',
    'colorfield',
    'apps.core',
    'apps.projects',
]

TEMPLATES[0]['DIRS'] = [BASE_DIR / 'templates']

STATICFILES_DIRS = [BASE_DIR / 'static/dist']
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_ROOT = BASE_DIR / 'media'
MEDIA_URL = '/media/'
EOF

cat > config/settings/dev.py <<'EOF'
from .base import *

DEBUG = True
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
EOF

cat > config/settings/prod.py <<'EOF'
from .base import *
from decouple import config as env, Csv

DEBUG = False
ALLOWED_HOSTS = env('ALLOWED_HOSTS', cast=Csv())

MIDDLEWARE = ['whitenoise.middleware.WhiteNoiseMiddleware'] + MIDDLEWARE

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': env('DB_NAME'),
        'USER': env('DB_USER'),
        'PASSWORD': env('DB_PASSWORD'),
        'HOST': env('DB_HOST', default='localhost'),
        'PORT': env('DB_PORT', default='5432'),
    }
}

STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
EOF

# ── Tailwind CSS ──────────────────────────
cat > package.json <<'EOF'
{
  "name": "portfolio",
  "version": "1.0.0",
  "scripts": {
    "dev": "tailwindcss -i ./static/src/css/main.css -o ./static/dist/css/main.css --watch",
    "build": "tailwindcss -i ./static/src/css/main.css -o ./static/dist/css/main.css --minify"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.0",
    "@tailwindcss/typography": "^0.5.0",
    "@tailwindcss/forms": "^0.5.0",
    "autoprefixer": "^10.4.0"
  }
}
EOF

cat > tailwind.config.js <<'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './templates/**/*.html',
    './static/src/js/**/*.js',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Cabinet Grotesk"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        accent: '#FF4D00',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
}
EOF

cat > static/src/css/main.css <<'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-zinc-950 text-zinc-100 font-body antialiased;
  }
}

@layer components {
  .btn-primary {
    @apply inline-flex items-center gap-2 px-6 py-3 bg-accent text-white font-semibold rounded-lg hover:opacity-90 transition;
  }
  .section {
    @apply max-w-6xl mx-auto px-6 py-20;
  }
}
EOF

# ── JS Modules ────────────────────────────
cat > static/src/js/main.js <<'EOF'
import { initNavbar } from './components/navbar.js'
import { initFilter } from './components/filter.js'
import { initContact } from './components/contact.js'

document.addEventListener('DOMContentLoaded', () => {
  initNavbar()
  initFilter()
  initContact()
})
EOF

cat > static/src/js/components/navbar.js <<'EOF'
export function initNavbar() {
  const nav = document.getElementById('navbar')
  const toggle = document.getElementById('menu-toggle')
  const mobileMenu = document.getElementById('mobile-menu')

  // Sticky shadow on scroll
  window.addEventListener('scroll', () => {
    nav?.classList.toggle('shadow-lg', window.scrollY > 20)
  })

  // Mobile toggle
  toggle?.addEventListener('click', () => {
    mobileMenu?.classList.toggle('hidden')
  })
}
EOF

cat > static/src/js/components/filter.js <<'EOF'
export function initFilter() {
  const buttons = document.querySelectorAll('[data-filter]')
  const cards = document.querySelectorAll('[data-tags]')

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter

      buttons.forEach(b => b.classList.remove('active-filter'))
      btn.classList.add('active-filter')

      cards.forEach(card => {
        const tags = card.dataset.tags.split(',')
        const show = filter === 'all' || tags.includes(filter)
        card.style.display = show ? '' : 'none'
      })
    })
  })
}
EOF

cat > static/src/js/components/contact.js <<'EOF'
export function initContact() {
  const form = document.getElementById('contact-form')
  if (!form) return

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const data = Object.fromEntries(new FormData(form))
    const csrfToken = document.cookie.match(/csrftoken=([^;]+)/)?.[1]

    try {
      const res = await fetch('/contact/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        form.innerHTML = '<p class="text-accent font-semibold">Message sent! I\'ll be in touch.</p>'
      }
    } catch {
      alert('Something went wrong. Please try again.')
    }
  })
}
EOF

# ── Templates ─────────────────────────────
cat > templates/base.html <<'EOF'
{% load static %}
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{% block title %}Your Name — Portfolio{% endblock %}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{% static 'dist/css/main.css' %}">
  {% block extra_head %}{% endblock %}
</head>
<body>
  {% include "components/navbar.html" %}
  <main>{% block content %}{% endblock %}</main>
  {% include "components/footer.html" %}
  <script type="module" src="{% static 'src/js/main.js' %}"></script>
  {% block extra_js %}{% endblock %}
</body>
</html>
EOF

cat > templates/components/navbar.html <<'EOF'
{% load static %}
<nav id="navbar" class="fixed top-0 w-full z-50 bg-zinc-950/80 backdrop-blur border-b border-zinc-800 transition-shadow">
  <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
    <a href="/" class="font-display font-bold text-xl tracking-tight">YourName<span class="text-accent">.</span></a>
    <button id="menu-toggle" class="md:hidden text-zinc-400 hover:text-white">☰</button>
    <ul class="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
      <li><a href="/#projects" class="hover:text-white transition">Projects</a></li>
      <li><a href="/#about" class="hover:text-white transition">About</a></li>
      <li><a href="/blog/" class="hover:text-white transition">Blog</a></li>
      <li><a href="/contact/" class="btn-primary text-xs px-4 py-2">Contact</a></li>
    </ul>
  </div>
  <ul id="mobile-menu" class="hidden md:hidden px-6 pb-4 flex flex-col gap-4 text-sm text-zinc-400">
    <li><a href="/#projects">Projects</a></li>
    <li><a href="/#about">About</a></li>
    <li><a href="/blog/">Blog</a></li>
    <li><a href="/contact/">Contact</a></li>
  </ul>
</nav>
EOF

cat > templates/components/footer.html <<'EOF'
<footer class="border-t border-zinc-800 mt-20">
  <div class="section flex flex-col md:flex-row items-center justify-between gap-4 py-10 text-sm text-zinc-500">
    <p>© {% now "Y" %} YourName. Built with Django & Tailwind.</p>
    <div class="flex gap-6">
      <a href="https://github.com/" target="_blank" class="hover:text-white transition">GitHub</a>
      <a href="https://linkedin.com/" target="_blank" class="hover:text-white transition">LinkedIn</a>
      <a href="mailto:you@email.com" class="hover:text-white transition">Email</a>
    </div>
  </div>
</footer>
EOF

cat > templates/components/project_card.html <<'EOF'
<article class="group bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-accent transition-colors"
         data-tags="{{ project.tags.all|join:',' }}">
  {% if project.thumbnail %}
    <img src="{{ project.thumbnail.url }}" alt="{{ project.title }}" class="w-full h-48 object-cover">
  {% endif %}
  <div class="p-6">
    <h3 class="font-display font-bold text-lg mb-2">{{ project.title }}</h3>
    <p class="text-zinc-400 text-sm mb-4 line-clamp-3">{{ project.description }}</p>
    <div class="flex gap-2 flex-wrap mb-4">
      {% for tag in project.tags.all %}
        <span class="text-xs px-2 py-1 bg-zinc-800 rounded-full text-zinc-300">{{ tag.name }}</span>
      {% endfor %}
    </div>
    <div class="flex gap-3">
      {% if project.live_url %}
        <a href="{{ project.live_url }}" target="_blank" class="btn-primary text-xs px-4 py-2">Live ↗</a>
      {% endif %}
      {% if project.repo_url %}
        <a href="{{ project.repo_url }}" target="_blank"
           class="text-xs px-4 py-2 border border-zinc-700 rounded-lg hover:border-accent transition text-zinc-300">Code</a>
      {% endif %}
    </div>
  </div>
</article>
EOF

cat > templates/core/home.html <<'EOF'
{% extends "base.html" %}
{% block content %}
<!-- Hero -->
<section class="section pt-36">
  <p class="text-accent font-semibold mb-3">Hi, I'm</p>
  <h1 class="font-display font-bold text-5xl md:text-7xl leading-tight mb-6">
    Your Name<span class="text-accent">.</span>
  </h1>
  <p class="text-zinc-400 text-xl max-w-xl mb-8">
    I build fast, beautiful web experiences. Focused on backend elegance and frontend craft.
  </p>
  <div class="flex gap-4">
    <a href="#projects" class="btn-primary">View Projects</a>
    <a href="/contact/" class="px-6 py-3 border border-zinc-700 rounded-lg hover:border-accent transition text-zinc-300">
      Get in touch
    </a>
  </div>
</section>

<!-- Projects -->
<section id="projects" class="section">
  <h2 class="font-display font-bold text-3xl mb-10">Selected Work</h2>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {% for project in projects %}
      {% include "components/project_card.html" %}
    {% endfor %}
  </div>
</section>
{% endblock %}
EOF

# ── Models ────────────────────────────────
cat > apps/projects/models.py <<'EOF'
from django.db import models

class Tag(models.Model):
    name = models.CharField(max_length=50)

    def __str__(self):
        return self.name

class Project(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    thumbnail = models.ImageField(upload_to='projects/', blank=True)
    live_url = models.URLField(blank=True)
    repo_url = models.URLField(blank=True)
    tags = models.ManyToManyField(Tag, blank=True)
    featured = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', '-created_at']

    def __str__(self):
        return self.title
EOF

cat > apps/projects/admin.py <<'EOF'
from django.contrib import admin
from .models import Project, Tag

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('title', 'featured', 'order', 'created_at')
    list_editable = ('featured', 'order')
    prepopulated_fields = {'slug': ('title',)}
    filter_horizontal = ('tags',)
    search_fields = ('title',)

@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    pass
EOF

cat > apps/core/views.py <<'EOF'
from django.shortcuts import render
from apps.projects.models import Project

def home(request):
    projects = Project.objects.prefetch_related('tags').all()
    return render(request, 'core/home.html', {'projects': projects})
EOF

cat > config/urls.py <<'EOF'
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from apps.core.views import home

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', home, name='home'),
    path('projects/', include('apps.projects.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
EOF

# ── Makefile ──────────────────────────────
cat > Makefile <<'EOF'
run:
	python manage.py runserver

css:
	npm run dev

build:
	npm run build

migrate:
	python manage.py makemigrations && python manage.py migrate

superuser:
	python manage.py createsuperuser

shell:
	python manage.py shell

collect:
	python manage.py collectstatic --noinput

install:
	pip install -r requirements.txt && npm install

fresh: install migrate superuser run
EOF

# ── Final Steps ───────────────────────────
npm install -q

echo ""
echo "✅ Done! Your portfolio is scaffolded at: $(pwd)"
echo ""
echo "Next steps:"
echo "  source .venv/bin/activate"
echo "  make migrate"
echo "  make superuser"
echo ""
echo "Then in two terminals:"
echo "  make run     # Django dev server"
echo "  make css     # Tailwind watcher"
