"""
Devicon catalog — the source of truth for skill logos.

Rather than uploading a logo per skill, we read Devicon's machine-readable index
(578 tech logos) and serve the SVGs straight from jsDelivr's CDN. Toggling a
skill on in the admin just records its slug; no file ever touches our storage.

The version is PINNED. `@latest` would let an upstream rename or removal
silently break logos that are already live.
"""

import logging
import re

import requests
from django.core.cache import cache

logger = logging.getLogger(__name__)

# Map awkward tech/language names (as GitHub or a human types them) onto the
# Devicon slug. Anything not here is matched by stripping to [a-z0-9] and trying
# that as a slug directly, which already covers python, java, rust, dart, etc.
_NAME_ALIASES = {
    'c++': 'cplusplus',
    'c#': 'csharp',
    'f#': 'fsharp',
    'objective-c': 'objectivec',
    'objective c': 'objectivec',
    'html': 'html5',
    'css': 'css3',
    'shell': 'bash',
    'jupyter notebook': 'jupyter',
    'node': 'nodejs',
    'node.js': 'nodejs',
    'golang': 'go',
    'vue': 'vuejs',
    'vue.js': 'vuejs',
    'next': 'nextjs',
    'next.js': 'nextjs',
    'nuxt': 'nuxtjs',
    'nuxt.js': 'nuxtjs',
    'tailwind': 'tailwindcss',
    'tailwind css': 'tailwindcss',
    'postgres': 'postgresql',
    'scss': 'sass',
    'dockerfile': 'docker',
    'vim script': 'vim',
    'vimscript': 'vim',
}

DEVICON_VERSION = 'v2.17.0'
_BASE = f'https://cdn.jsdelivr.net/gh/devicons/devicon@{DEVICON_VERSION}'
INDEX_URL = f'{_BASE}/devicon.json'

CACHE_KEY = f'devicon:catalog:{DEVICON_VERSION}'
CACHE_TTL = 60 * 60 * 24  # a day; the pinned index never changes

# Preference order when an icon ships several variants; full-colour first.
# "wordmark" variants bake in the brand text and are wide rather than square, so
# they are only used when an icon offers nothing else (AWS, LESS, Splunk, Stata,
# Knockout and PyScript ship wordmarks only — dropping them would be worse).
_VARIANT_PREFERENCE = ('original', 'plain', 'line')
_WORDMARK_PREFERENCE = ('original-wordmark', 'plain-wordmark', 'line-wordmark')


class DeviconUnavailable(RuntimeError):
    """The catalog could not be fetched (network/CDN problem)."""


def icon_url(slug, variant):
    """CDN URL for a single icon, e.g. .../icons/django/django-plain.svg"""
    return f'{_BASE}/icons/{slug}/{slug}-{variant}.svg'


def _pick_variant(svg_variants):
    """Choose the nicest variant: square and full-colour where possible.

    Falls back to a wordmark only for icons that ship nothing else, and stays
    deterministic rather than depending on the order upstream happens to list.
    """
    square = [v for v in svg_variants if 'wordmark' not in v]
    for preferred in _VARIANT_PREFERENCE:
        if preferred in square:
            return preferred
    if square:
        return square[0]

    for preferred in _WORDMARK_PREFERENCE:
        if preferred in svg_variants:
            return preferred
    return svg_variants[0] if svg_variants else None


def _label(slug):
    """A human name for a devicon slug ('cplusplus' -> 'Cplusplus')."""
    return slug.replace('-', ' ').replace('_', ' ').strip().title()


def get_catalog(force_refresh=False):
    """Return [{slug, label, variant, url, tags}, …], newest fetch cached.

    Raises DeviconUnavailable when the catalog can't be fetched and nothing is
    cached, so callers can render a proper error state instead of a blank grid.
    """
    if not force_refresh:
        cached = cache.get(CACHE_KEY)
        if cached:
            return cached

    try:
        response = requests.get(INDEX_URL, timeout=15)
        response.raise_for_status()
        raw = response.json()
    except Exception as exc:
        logger.warning('Devicon catalog fetch failed: %s', exc)
        stale = cache.get(CACHE_KEY)
        if stale:
            return stale
        raise DeviconUnavailable(str(exc)) from exc

    catalog = []
    for entry in raw:
        slug = entry.get('name')
        variants = (entry.get('versions') or {}).get('svg') or []
        if not slug or not variants:
            continue
        variant = _pick_variant(variants)
        if not variant:
            continue
        catalog.append({
            'slug': slug,
            'label': _label(slug),
            'variant': variant,
            'url': icon_url(slug, variant),
            'tags': entry.get('tags') or [],
        })

    catalog.sort(key=lambda item: item['label'].lower())
    cache.set(CACHE_KEY, catalog, CACHE_TTL)
    return catalog


def resolve_icon(name):
    """Best-effort: map a tech/language name to its Devicon catalog entry.

    Returns the catalog dict ({slug, label, variant, url, tags}) or None when
    there's no confident match. Never raises — a missing icon must not block a
    save or a GitHub sync.
    """
    if not name:
        return None

    key = name.strip().lower()
    slug = _NAME_ALIASES.get(key)
    if slug is None:
        norm = re.sub(r'[^a-z0-9]+', '', key)
        slug = _NAME_ALIASES.get(norm, norm)

    try:
        catalog = {item['slug']: item for item in get_catalog()}
    except DeviconUnavailable:
        return None
    return catalog.get(slug)
