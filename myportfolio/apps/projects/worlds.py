"""Project worlds.

Every project page is its own world: its own colours, typefaces and layouts,
free of Mich's brand rules (only the frame — nav, footer — and the red dot cross
over). A world is a preset plus any overrides set on the project in the admin.

Fonts are Google Fonts "family specs", exactly as they appear after `family=` in
a css2 URL, e.g. `Anton` or `Cormorant+Garamond:ital,wght@0,400;1,500`.
"""
from urllib.parse import quote

PRESETS = {
    # For work added later from the admin: pick one, then tweak if you like.
    'paper': {
        'label': 'Paper — warm white, editorial serif',
        'bg': '#F4F1EA', 'fg': '#161514', 'accent': '#2F4BFF', 'muted': '#E7E1D4',
        'display': 'Instrument+Serif:ital@0;1', 'body': 'Inter:wght@400;500',
    },
    'terminal': {
        'label': 'Terminal — dark, green, monospace',
        'bg': '#0D110E', 'fg': '#D9F2DE', 'accent': '#3DF57A', 'muted': '#18201A',
        'display': 'JetBrains+Mono:wght@500;800', 'body': 'JetBrains+Mono:wght@400',
    },
    'midnight': {
        'label': 'Midnight — deep blue, crisp grotesk',
        'bg': '#0B1020', 'fg': '#E6E9F5', 'accent': '#8EA6FF', 'muted': '#151C33',
        'display': 'Space+Grotesk:wght@500;700', 'body': 'Inter:wght@400;500',
    },
    'signal': {
        'label': 'Signal — loud orange, heavy type',
        'bg': '#FF5A1F', 'fg': '#170C07', 'accent': '#FFF2E8', 'muted': '#FF7A45',
        'display': 'Archivo+Black', 'body': 'Archivo:wght@400;500',
    },
    'mint': {
        'label': 'Mint — fresh, friendly, rounded',
        'bg': '#DDF4E8', 'fg': '#0E2A1D', 'accent': '#0B8A54', 'muted': '#C6EAD7',
        'display': 'Bricolage+Grotesque:opsz,wght@12..96,500;12..96,800', 'body': 'Inter:wght@400;500',
    },
}

PRESET_CHOICES = [(k, v['label']) for k, v in PRESETS.items()]

LAYOUT_CHOICES = [
    ('wall', 'Wall — pinned-up sketches, scattered and tilted'),
    ('split', 'Split — words on one side, a big image on the other'),
    ('fullbleed', 'Full bleed — one image edge to edge, words over it'),
    ('specimen', 'Specimen — palette, type and marks laid out like a sheet'),
    ('gallery', 'Gallery — a strip of images to scroll through'),
    ('statement', 'Statement — just big words'),
    ('pillars', 'Pillars — one idea per line: "Title: text"'),
]

HERO_CHOICES = [
    ('poster', 'Poster — huge title over the cover'),
    ('split', 'Split — title beside the cover'),
    ('stacked', 'Stacked — title, then the cover below'),
]

# The default three steps, by kind of work: (title, kicker, layout).
# Design follows Mich's own workflow; dev tells it the way it actually goes.
DESIGN_STEPS = [
    ('The thought', 'On paper first. Messy, hard work, and fun.', 'wall'),
    ('The brand', 'Colour, type, pattern: the parts that make it a brand.', 'specimen'),
    ('The experience', 'The brand out in real places, with real people.', 'gallery'),
]
DEV_STEPS = [
    ('The itch', 'What bugged me enough to open a code editor.', 'statement'),
    ('The rabbit hole', 'How it got built. Detours, 2am decisions and all.', 'split'),
    ('The souvenirs', 'What I brought back: lessons, scars, and what I’d do differently.', 'pillars'),
]


def family_name(spec):
    """'Cormorant+Garamond:ital,wght@1,500' -> 'Cormorant Garamond'.
    'local:Clash Display' -> 'Clash Display' (a face the site already serves)."""
    spec = spec or ''
    if spec.startswith('local:'):
        return spec[6:].strip()
    return spec.split(':')[0].replace('+', ' ').strip()


def fonts_url(specs, text=None):
    specs = [s for s in dict.fromkeys(specs) if s and not s.startswith('local:')]
    if not specs:
        return ''
    url = 'https://fonts.googleapis.com/css2?' + '&'.join(f'family={s}' for s in specs) + '&display=swap'
    if text:
        # Only the glyphs needed (used for home-page titles): tiny font files.
        url += '&text=' + quote(''.join(sorted(set(text))))
    return url


def resolve(project):
    """The project's world: preset + overrides, ready for templates."""
    base = PRESETS.get(project.world_preset) or PRESETS['paper']
    w = {
        'bg': project.world_bg or base['bg'],
        'fg': project.world_fg or base['fg'],
        'accent': project.world_accent or base['accent'],
        'muted': project.world_muted or base['muted'],
        'display_spec': project.world_display_font or base['display'],
        'body_spec': project.world_body_font or base['body'],
    }
    w['display'] = family_name(w['display_spec'])
    w['body'] = family_name(w['body_spec'])
    w['fonts_url'] = fonts_url([w['display_spec'], w['body_spec']])
    w['title_font_url'] = fonts_url([w['display_spec']], text=project.title + '0123456789')
    w['style'] = (
        f"--w-bg:{w['bg']};--w-fg:{w['fg']};--w-accent:{w['accent']};--w-muted:{w['muted']};"
        f"--w-display:'{w['display']}';--w-body:'{w['body']}';"
    )
    return w
