"""The design projects, as data for `manage.py seed_content`.

Words come from Mich's own decks, notebook pages and folder notes; images live in
seed_assets/<slug>/. Everything here becomes ordinary admin content afterwards.
Media entries: (filename, kind, alt, caption). kind: 'photo' or 'artwork'.
"""

PROJECTS = [
    {
        'slug': 'wendys-treats',
        'title': "Wendy's Treats",
        'category': 'Brand identity',
        'role': 'Brand designer',
        'aside': 'she was sooo sweet',
        'hook': 'A bakery brand with a 1950s mascot, pillowy type and one job: feed your inner child.',
        'description': 'Wendy bakes nostalgic, small-batch treats. The brand had to feel like her: warm, '
                       'a little retro, and impossible to walk past without smiling.',
        'starting_point': "A baker with a lot of love and no visual identity. The line I kept coming back to: "
                          "Wendy isn't a faceless factory. She's a friend, a neighbour, and a craftsman who "
                          "bakes with personal love and care.",
        'outcome': "A full identity: wordmark, a mascot drawn from Wendy herself, a sticker-ready icon set, "
                   "colour, type and packaging. It's hard to be in a bad mood around that mascot.",
        'mockup': 'page-03.webp',
        'world': {
            'world_bg': '#FF7474', 'world_fg': '#3A0D63', 'world_accent': '#541388', 'world_muted': '#FFD8CF',
            'world_display_font': 'Chewy', 'world_body_font': 'Nunito:wght@400;700', 'world_hero': 'split',
        },
        'palette': [
            {'hex': '#541388', 'name': 'Indigo'}, {'hex': '#D6336C', 'name': 'Razzmatazz'},
            {'hex': '#FF7474', 'name': 'Grapefruit pink'}, {'hex': '#3D2314', 'name': 'Dark coffee'},
        ],
        'css': """
.world--wendys-treats .media img { border-radius: 28px; }
.world--wendys-treats .world-hero__title, .world--wendys-treats .chapter__title { rotate: -2deg; }
.world--wendys-treats .chapter--even { background: #541388; color: #FFE9E4; }
.world--wendys-treats .world-aside { background: #fff; color: #541388; border: 0; rotate: -1.5deg; }
.world--wendys-treats .pillar { border-top: 0; background: #fff; border-radius: 26px; padding: 26px; margin: 8px; color: #3A0D63; }
.world--wendys-treats .media--artwork { background: #fff; border-radius: 28px; }
""",
        'chapters': [
            ('The thought', 'Notes first, sketches second, colour last.', 'wall',
             'Pages of notes before a single colour: the brand pillars, the truth behind each one, '
             'and an early sketch of the face that became the mascot.',
             [('sketch-08.webp', 'photo', 'Notebook page: brand pillars for Wendy\'s Treats', ''),
              ('sketch-09.webp', 'photo', 'Notebook page: mascot sketch and type notes', 'Candy script + Museo Sans Rounded'),
              ('sketch-10.webp', 'photo', 'Notebook page: brand truths and early marks', '')]),
            ('The brand', 'Four pillars, straight from the notebook.', 'pillars',
             "Inner-child indulgence: Pastries aren't just food. They're permission to play, indulge and celebrate without judgment.\n"
             "Warm hospitality: Wendy isn't a faceless factory. She's a friend, a neighbour and a craftsman.\n"
             "Universal celebration: Cakes and pastries cross every age and background. They're the centrepiece of shared moments.\n"
             "Playful craftsmanship: Handmade, small-batch baking that feels elevated yet completely accessible, with retro charm.",
             [('wendys-treats-logo.svg', 'artwork', "Wendy's Treats wordmark with the mascot", ''),
              ('wendy-mascot.svg', 'artwork', 'Wendy, the mascot', 'Wendy, as a mascot'),
              ('icons.svg', 'artwork', 'Icon set: piping bag, croissant, whisk, cake and more', ''),
              ('page-06.webp', 'photo', 'Typography: Museo Sans Rounded, Hobeaux and Brush Script', ''),
              ('page-07.webp', 'photo', 'Colour palette', '')]),
            ('The experience', 'Bags, boxes, aprons, a shop sign. Sugary kindness, everywhere.', 'gallery', '',
             [('cover.webp', 'photo', "Wendy's Treats logo over a tray of pastries", ''),
              ('page-10.webp', 'photo', 'Sticker set', 'Stickers'),
              ('page-11.webp', 'photo', 'Bread bag', 'Bread bag'),
              ('page-12.webp', 'photo', 'Apron', 'Apron'),
              ('page-13.webp', 'photo', 'Open-hours board and round shop sign', 'Open hours, and the sign'),
              ('page-14.webp', 'photo', 'Takeaway box', 'Takeaway box'),
              ('page-15.webp', 'photo', 'Wrapping paper', 'Wrapping paper'),
              ('page-09.webp', 'photo', 'Open hours card and "Sugary Kindness"', ''),
              ('page-05.webp', 'photo', 'Stickers on pastries', 'Taste it. Love it. Crave it.')]),
        ],
    },
    {
        'slug': 'bykenzel',
        'title': 'ByKenzel',
        'category': 'Brand identity',
        'role': 'Brand designer',
        'aside': 'first brand to trust me',
        'hook': "From “simple but plain” to an auteur's signature: a rebrand for a photographer and filmmaker.",
        'description': "Kenzel shoots photos and films. His old logo didn't say any of that. The rebrand turned "
                       "his name into a signature: a mark of ownership, the way a director signs a film.",
        'starting_point': "His old wordmark, in my notes at the time: simple but plain, too conservative, no "
                          "intention. It didn't portray where the brand was going.",
        'outcome': "A hand-signed logotype with a compact BK mark, emerald and liquid gold, a geometric pattern, "
                   "and rules for keeping the script intact. He was the first client to trust me with his name. "
                   "I didn't take that lightly.",
        'mockup': 'photo-2.webp',
        'world': {
            'world_bg': '#07140F', 'world_fg': '#EFE6D2', 'world_accent': '#C9A45C', 'world_muted': '#0B241A',
            'world_display_font': 'DM+Serif+Display:ital@0;1', 'world_body_font': 'Quicksand:wght@400;600',
            'world_hero': 'poster',
        },
        'palette': [
            {'hex': '#0A6044', 'name': 'Emerald green'}, {'hex': '#C9A45C', 'name': 'Gold'},
            {'hex': '#000000', 'name': 'Black'}, {'hex': '#FFFFFF', 'name': 'White'},
        ],
        'css': """
.world--bykenzel .chapter__title, .world--bykenzel .world-hero__title { font-style: italic; }
.world--bykenzel .media--photo img { border-block: clamp(10px, 2.2vw, 30px) solid #000; }
.world--bykenzel .world-label { color: #C9A45C; opacity: 1; }
.world--bykenzel .world-hero--poster .world-hero__cover img { filter: saturate(.8) contrast(1.05); }
.world--bykenzel::after { content: ''; position: fixed; inset: 0; pointer-events: none; opacity: .06;
  background-image: radial-gradient(#fff 1px, transparent 1px); background-size: 3px 3px; }
""",
        'chapters': [
            ('The thought', 'What does it look like to listen first?', 'split',
             "Kenzel's own line set the tone: “I listen first. I capture your vision through deep "
             "perspective and intentional framing.” The old logo said none of that. The new one had to.",
             [('page-02.webp', 'photo', 'Manifesto slide: I listen first', ''),
              ('page-03.webp', 'photo', 'The old ByKenzel logo, with notes', 'The old logo: simple, but plain'),
              ('page-04.webp', 'photo', 'New logo concept: a personal signature', '')]),
            ('The brand', 'A signature, not a font.', 'specimen',
             'Elegance, intention and craftsmanship in one stroke, with a compact BK for watermarks and '
             'small spaces, and a pattern cut from the same curves.',
             [('page-05.webp', 'photo', 'The ByKenzel signature in gold on emerald', ''),
              ('page-06.webp', 'photo', 'Logo colour variations', ''),
              ('page-08.webp', 'photo', 'Logomark: from ByKenzel to BK', ''),
              ('page-12.webp', 'photo', 'Geometric gold pattern', '')]),
            ('The experience', 'On merch, on screen, and signed into his own work.', 'fullbleed', '',
             [('page-14.webp', 'photo', 'Keychain, lanyard, letterhead, bracelets and stickers', ''),
              ('page-15.webp', 'photo', 'Tab bar, headphones, cap and hoodie', ''),
              ('page-09.webp', 'photo', 'BK mark on a director\'s chair', ''),
              ('photo-1.webp', 'photo', 'A restaurant interior photographed by Kenzel, signed', ''),
              ('photo-3.webp', 'photo', 'A fashion shoot by Kenzel, signed BK', '')]),
        ],
    },
    {
        'slug': 'do-not-do-tech',
        'title': 'Do Not Do Tech',
        'category': 'Brand identity',
        'role': 'Founder, designer, everything',
        'aside': 'my attempt at starting a stylish yet functional developer clothing brand',
        'hook': "Clothes for developers who were told not to. Somewhere between “I could” and “I did.”",
        'description': 'A streetwear brand for people who build things anyway. Loud on purpose: acid '
                       'chartreuse, blackened aubergine, and a logotype that looks half-decoded.',
        'starting_point': 'Dev merch is usually a logo on a black hoodie. I wanted clothing with a point of '
                          'view: honest, persistent, curious, funny, and made with craft.',
        'outcome': "An identity, a palette where every colour has a name and a job, and a set of “coming "
                   "soon” posters. It's still an attempt, not a shop. The posters still make me want to build it.",
        'mockup': 'dnd-3.webp',
        'world': {
            'world_bg': '#C7F000', 'world_fg': '#0B0B0A', 'world_accent': '#0B0B0A', 'world_muted': '#17121C',
            'world_display_font': 'Anton', 'world_body_font': 'Space+Mono:wght@400;700', 'world_hero': 'split',
        },
        'palette': [
            {'hex': '#C7F000', 'name': 'DND Acid'}, {'hex': '#17121C', 'name': 'DND Dark'},
            {'hex': '#A45F43', 'name': 'DND Metal'}, {'hex': '#E9E2D4', 'name': 'DND Bone'},
            {'hex': '#0B0B0A', 'name': 'DND Ink'},
        ],
        'css': """
.world--do-not-do-tech .world-hero__title, .world--do-not-do-tech .chapter__title { text-transform: uppercase; letter-spacing: 0; }
.world--do-not-do-tech .chapter--even { background: #17121C; color: #E9E2D4; }
.world--do-not-do-tech .chapter--even .chapter__title { color: #C7F000; }
.world--do-not-do-tech .wall__pin { --tilt: 0deg !important; margin-top: 0 !important; box-shadow: 10px 10px 0 #0B0B0A; }
.world--do-not-do-tech .wall__pin::before { background: #C7F000; }
.world--do-not-do-tech .media img { border: 3px solid currentColor; }
.world--do-not-do-tech .world-aside { border: 3px solid #0B0B0A; border-radius: 0; font-weight: 700; }
.world--do-not-do-tech .world-hero__cover { aspect-ratio: 1080 / 2002; max-height: 84svh; justify-self: center; box-shadow: 14px 14px 0 #0B0B0A; }
""",
        'chapters': [
            ('The thought', 'Six values before a single letter.', 'wall',
             'Authenticity, persistence, curiosity, humor, craft, self-respect. Then page after page of DND '
             'letterforms until one stuck, and a palette where every colour got a job description.',
             [('sketch-11.webp', 'photo', 'Notebook page: named DND colours and layout tests', 'Acid, Dark, Metal, Bone, Ink'),
              ('sketch-12.webp', 'photo', 'Notebook page: six brand values and early wordmarks', ''),
              ('sketch-14.webp', 'photo', 'Notebook page: DO NOT DO TECH letterform explorations', '')]),
            ('The brand', 'Every colour has a name and a job.', 'specimen',
             'Acid interrupts. Dark gives depth. Metal is for craft. Bone is breathing room. Ink does everything else.',
             [('logomark.svg', 'artwork', 'DND logomark', ''),
              ('wordmark.svg', 'artwork', 'Do Not Do Tech wordmark', ''),
              ('dnd-1.webp', 'photo', 'Brand board: marks, palette and type', '')]),
            ('The experience', 'Coming soon. Probably.', 'gallery', '',
             [('dnd-3.webp', 'photo', "Poster: You've been told not to. Good.", "You've been told not to. Good."),
              ('dnd-2.webp', 'photo', 'Poster: somewhere between I could and I did', "Somewhere between “I could” and “I did.”"),
              ('dnd-4.webp', 'photo', "Poster: That's where the work happens", "That's where the work happens.")]),
        ],
    },
    {
        'slug': 'alphadrivers',
        'title': 'AlphaDrivers237',
        'category': 'Brand identity',
        'role': 'Design intern: identity and brand guideline',
        'date_range': '2026',
        'aside': "my first design internship. It's a lot of work",
        'hook': "A chauffeur network has to feel safe before anyone gets in the car. That's a brand problem.",
        'description': 'AlphaDrivers connects vehicle owners with certified professional drivers in Douala, '
                       'Yaoundé, Bafoussam and Buea. I designed the identity and wrote the brand guideline: '
                       'logo system, colour, type, iconography and the rules that hold it all together.',
        'starting_point': 'The idea in my notebook: A + D, shaped like a steering wheel. Several drafts died '
                          'for reasons I wrote right next to them: visual clutter, misinterpretation, brand disconnect.',
        'outcome': "Version 1.0 of the guideline: a geometric A/D monogram, a blue system whose status colours "
                   "actually mean something on screen, three typefaces with clear jobs, and applications from "
                   "lanyards to billboards. Also my first real lesson in how much work a “simple” logo is.",
        'mockup': 'page-01.webp',
        'world': {
            'world_bg': '#2D62E3', 'world_fg': '#FFFFFF', 'world_accent': '#FFFFFF', 'world_muted': '#F7F6FC',
            'world_display_font': 'Sora:wght@400;600;700', 'world_body_font': 'Plus+Jakarta+Sans:wght@400;500',
            'world_hero': 'split',
        },
        'palette': [
            {'hex': '#3772FF', 'name': 'Crayola Blue'}, {'hex': '#241F38', 'name': 'Midnight Violet'},
            {'hex': '#0D225C', 'name': 'Deep Navy'}, {'hex': '#F7F6FC', 'name': 'Ghost White'},
            {'hex': '#171C26', 'name': 'Ink Black'},
        ],
        'css': """
.world--alphadrivers { background-image: linear-gradient(rgba(255,255,255,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.07) 1px, transparent 1px); background-size: 64px 64px; }
.world--alphadrivers .chapter__num { font-family: 'JetBrains Mono', monospace; font-size: 1.6rem; letter-spacing: 0; opacity: 1; }
.world--alphadrivers .chapter__num::before { content: '['; }
.world--alphadrivers .chapter__num::after { content: ']'; }
.world--alphadrivers .chapter__title::after { content: ';'; }
.world--alphadrivers .chapter--even { background: #F7F6FC; color: #171C26; }
.world--alphadrivers .wall__pin::before { background: #96B2F4; }
""",
        'chapters': [
            ('The thought', 'Seven drafts, seven verdicts.', 'wall',
             "Numbered drafts on one page, each with an honest note next to it. Draft six: “all "
             "overlaying, failure.” Notes like that are how the good one survived.",
             [('sketch-05.webp', 'photo', 'Notebook page: numbered AlphaDrivers logo drafts with verdicts', ''),
              ('sketch-06.webp', 'photo', 'Notebook page: refined A/D marks', '')]),
            ('The brand', 'Geometry, status colours, three typefaces.', 'specimen',
             'A monogram built on a grid, a palette that doubles as a status system (success, alert, danger, '
             'information), and Sora, Plus Jakarta Sans and JetBrains Mono, each with one job.',
             [('page-05.webp', 'photo', 'Logo system and geometry', ''),
              ('page-06.webp', 'photo', 'Logo rules and misuse', ''),
              ('page-08.webp', 'photo', 'System status palette', ''),
              ('page-09.webp', 'photo', 'Typography: Sora, Plus Jakarta Sans, JetBrains Mono', ''),
              ('page-10.webp', 'photo', 'Iconography and brand pattern', '')]),
            ('The experience', 'Less time driving, more freedom to live.', 'fullbleed', '',
             [('page-13.webp', 'photo', 'AlphaDrivers billboard on a city street at night', ''),
              ('page-11.webp', 'photo', 'Driver lanyard and branded T-shirt', ''),
              ('page-12.webp', 'photo', 'App screens and a branded cap', ''),
              ('page-14.webp', 'photo', 'Building wrap: Tap, Book, Relax', '')]),
        ],
    },
    {
        'slug': 'kazi',
        'title': 'Kazi',
        'category': 'Brand identity',
        'role': 'Co-founder & CTO (and the brand)',
        'aside': 'my first startup, where I happen to be the CTO and the everything guy',
        'hook': 'An AI employee for small businesses. First, it needed a face people would trust with their shop.',
        'description': "Kazi does the repetitive work for small businesses so the owner can focus on growth. "
                       "I'm building the product; this is the other half of my job there: making it look like "
                       "something you'd want on your team.",
        'starting_point': 'Logo concepts from my notebook: warmth, growth, freedom, sun rays. Fun for the '
                          'wordmark, simple for the logo, community for the mark.',
        'outcome': 'A sun-ray mark, a bold condensed voice, orange against sky blue, and illustration that does '
                   'the explaining. The product side gets its own story here once it ships.',
        'mockup': 'presentation.webp',
        'world': {
            'world_bg': '#F4F7FB', 'world_fg': '#0D0D0D', 'world_accent': '#FF6A1A', 'world_muted': '#DCEBF7',
            'world_display_font': 'Oswald:wght@500;700', 'world_body_font': 'Inter:wght@400;500',
            'world_hero': 'stacked',
        },
        'palette': [],
        'css': """
.world--kazi { background: linear-gradient(165deg, #FFF3EA 0%, #F4F7FB 40%, #DCEBF7 100%); }
.world--kazi .chapter--even { background: transparent; }
.world--kazi .world-hero__title, .world--kazi .chapter__title { text-transform: none; font-weight: 700; }
.world--kazi .chapter__num { color: #FF6A1A; opacity: 1; }
.world--kazi .statement__words { color: #0D0D0D; }
.world--kazi .statement__words::first-line { color: #FF6A1A; }
""",
        'chapters': [
            ('The thought', 'Rays around a centre.', 'split',
             'Two notebook pages of names, roles and marks. The one that stuck started as rays around a '
             'centre: a business, and the crowd it builds around it.',
             [('sketch-16.webp', 'photo', 'Notebook page: Kazi logo concepts, warmth, growth, freedom', ''),
              ('sketch-07.webp', 'photo', 'Notebook page: early Kazi marks', '')]),
            ('The brand', 'Say it in five words.', 'statement',
             'Run your business.\nBuild your crowd.', []),
            ('The experience', 'The first public face of Kazi.', 'fullbleed', '',
             [('presentation.webp', 'photo', 'Kazi launch visual: Run your business, build your crowd', '')]),
        ],
    },
    {
        'slug': 'kombien',
        'title': 'Kombien',
        'category': 'Brand identity',
        'role': 'Creator, designer, maintainer',
        'aside': "my first open-source project, fixing something I face every day: not knowing the taxi fare "
                 "before I leave the house, so I overpay. Yh, it hurts",
        'hook': "“Kombien?” means “how much?” In a Yaoundé taxi, not knowing the answer costs you.",
        'description': "Taxi fares here get negotiated on the curb, and if you don't know the going rate, you "
                       "pay more. Kombien is an open-source app for knowing the fare before you leave the "
                       "house. This is its identity; the code gets its own chapter when it ships.",
        'starting_point': 'Three words in a margin: anonymous, street-smart, community. The mark had to feel '
                          'like the city, not like a bank.',
        'outcome': 'A hand-sign mark, the way you flag a taxi; a playful custom wordmark with two little people '
                   'hiding in the “m”; charcoal and taxi orange.',
        'logo': 'lockup.webp',
        'world': {
            'world_bg': '#1E1E1E', 'world_fg': '#F3EEE3', 'world_accent': '#F4A23C', 'world_muted': '#2A2826',
            'world_display_font': 'Fredoka:wght@400;600', 'world_body_font': 'Fredoka:wght@400;600',
            'world_hero': 'split',
        },
        'palette': [
            {'hex': '#1E1E1E', 'name': 'Charcoal'}, {'hex': '#F4A23C', 'name': 'Taxi orange'},
            {'hex': '#F3EEE3', 'name': 'Bone'},
        ],
        'css': """
.world--kombien .chapter__head::after { content: ''; display: block; height: 12px; width: min(280px, 60%); margin-top: 18px;
  background: repeating-linear-gradient(90deg, #F4A23C 0 12px, transparent 12px 24px); }
.world--kombien .chapter__title { color: #F4A23C; }
.world--kombien .media--artwork { background: #F3EEE3; border-radius: 24px; }
.world--kombien .media img { border-radius: 18px; }
""",
        'chapters': [
            ('The thought', 'Anonymous + street-smart + community.', 'wall',
             'Scribbled in a margin, then clouds, cars and a lot of K. Somewhere on page two, the word itself '
             'started doing the work.',
             [('sketch-13.webp', 'photo', 'Notebook page: Kombien concepts, anonymous, street-smart, community', ''),
              ('sketch-15.webp', 'photo', 'Notebook page: Kombien wordmark explorations', '')]),
            ('The brand', "Read the “m” again.", 'specimen',
             'Two people, hiding in plain sight. Community, built into the name.',
             [('app-icon.webp', 'artwork', 'Kombien app icon: a hand sign', 'The app icon'),
              ('wordmark.webp', 'artwork', 'Kombien wordmark on charcoal', ''),
              ('lockup.webp', 'artwork', 'Kombien icon and wordmark lockup', '')]),
            ('The experience', 'Still being built, in the open.', 'statement',
             "When it's out, this is where you'll see it in people's hands. Until then: ask before you get in.",
             []),
        ],
    },
    {
        'slug': 'my-very-first-design',
        'title': 'My very first design',
        'category': 'Brand identity',
        'role': 'Designer, learning on the job',
        'aside': 'everyone starts somewhere. Mine was loud and pink',
        'hook': 'A poster for the Hult Prize on-campus finals, made before I knew what a grid was.',
        'description': 'The first design I’m still happy to show: hot pink, yellow, and a crowd of '
                       'silhouettes walking down a road of type.',
        'starting_point': 'An event needed a poster and I said yes before I knew how. That’s still roughly '
                          'how I learn things.',
        'outcome': 'It got me hooked. The Kenzel cover next to it came a little later: same energy, a bit more restraint.',
        'mockup': 'poster.webp',
        'world': {
            'world_bg': '#D0106E', 'world_fg': '#FFFFFF', 'world_accent': '#F7C32E', 'world_muted': '#B30C5E',
            'world_display_font': 'Big+Shoulders+Display:wght@700;900', 'world_body_font': 'Archivo:wght@400;500',
            'world_hero': 'split',
        },
        'palette': [],
        'css': """
.world--my-very-first-design .world-hero__title, .world--my-very-first-design .chapter__title { color: #F7C32E; text-transform: uppercase; letter-spacing: .02em; }
.world--my-very-first-design .world-hero--split .world-hero__cover { aspect-ratio: 2 / 3; max-height: 82svh; justify-self: center; }
.world--my-very-first-design .world-hero__cover img { object-fit: contain; }
""",
        'chapters': [
            ('The thought', 'Loud enough to stop someone at a noticeboard.', 'statement',
             'That was the whole brief I gave myself.', []),
            ('The brand', 'Pink, yellow, and a road made of letters.', 'split',
             'Silhouettes walking toward the finals, and type you could almost walk on.',
             [('poster.webp', 'photo', 'Hult Prize on-campus finals poster in pink and yellow', '')]),
            ('The experience', 'A little later.', 'split',
             "A cover for Kenzel's branding deck. Same energy, more restraint.",
             [('kenzel-cover.webp', 'photo', 'Kenzel Branding & Design cover', '')]),
        ],
    },
    {
        'slug': 'mich-the-brand',
        'title': 'Mich, the brand',
        'category': 'Brand identity',
        'role': 'Everything, for better or worse',
        'aside': 'finally took the time to brand myself',
        'hook': "An identity for a person, not a profession. You're standing in it.",
        'description': 'My own identity: a wordmark, a monogram, a number and a red dot that refuses to sit still.',
        'starting_point': "My old site introduced a job title. I wanted something that still made sense if the job title changed.",
        'outcome': 'Cream and dark brown doing the work, red used like punctuation, hand-drawn marks with a '
                   'sticker outline. This site is its first real test. The other worlds are its proof that it '
                   'knows when to step aside.',
        'logo': 'logomark-secondary.svg',
        'world': {
            'world_bg': '#F3EBDD', 'world_fg': '#2A1E1A', 'world_accent': '#B3262E', 'world_muted': '#F3E2C6',
            'world_display_font': 'local:Clash Display', 'world_body_font': 'DM+Sans:wght@400;500',
            'world_hero': 'stacked',
        },
        'palette': [
            {'hex': '#F3EBDD', 'name': 'Cream'}, {'hex': '#2A1E1A', 'name': 'Dark brown'}, {'hex': '#B3262E', 'name': 'Red'},
        ],
        'css': """
.world--mich-the-brand .world-hero__title, .world--mich-the-brand .chapter__title { font-weight: 600; }
""",
        'chapters': [
            ('The thought', 'Doodles in the margins of a data science page.', 'wall',
             'The first E, M and 21, drawn where they shouldn’t have been. Later, the page where it all came '
             'together: cream, dark brown, Michel red.',
             [('sketch-02.webp', 'photo', 'Notebook page: first E, M and 21 doodles', ''),
              ('sketch-15.webp', 'photo', 'Notebook page: palette notes, cream, dark brown, Michel red', '')]),
            ('The brand', 'Three marks and a dot.', 'specimen',
             'Every red dot on this site is the same one, from the same logos.',
             [('wordmark.svg', 'artwork', 'MICH wordmark', ''),
              ('logomark-primary.svg', 'artwork', 'EM. logomark', ''),
              ('logomark-secondary.svg', 'artwork', '2·1 logomark', '')]),
            ('The experience', "You're standing in it.", 'statement',
             'Scroll to the bottom. The dot always finds its way home.', []),
        ],
    },
]
