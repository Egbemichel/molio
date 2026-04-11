from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
import os
from apps.core.models import Skill, Education, Service, GalleryItem


class Command(BaseCommand):
    help = 'Populate the portfolio with initial data'

    def handle(self, *args, **options):
        self.stdout.write("Creating Education entries...")
        if not Education.objects.exists():
            education = Education.objects.create(
                degree='Bsc. Software Engineering',
                school='ICT University',
                location='Yaounde, Cameroon',
                faculty='Faculty of ICT',
                dates='2023 - 2027',
                is_current=True,
                order=1
            )
            self.stdout.write(self.style.SUCCESS(f"✓ Created: {education}"))
        else:
            self.stdout.write("Education already exists")

        self.stdout.write("Creating Skills...")
        skills_data = [
            {'name': 'Nextjs', 'icon_file': 'next.png'},
            {'name': 'Reactjs', 'icon_file': 'react.png'},
            {'name': 'Graphql', 'icon_file': 'graphql.png'},
            {'name': 'Blender', 'icon_file': 'blender.png'},
            {'name': 'Figma', 'icon_file': 'figma.png'},
            {'name': 'After Effects', 'icon_file': 'after-effects.png'},
            {'name': 'Flutter', 'icon_file': 'flutter.png'}
        ]
        
        for idx, skill_data in enumerate(skills_data):
            skill, created = Skill.objects.get_or_create(
                name=skill_data['name'],
                defaults={'order': idx}
            )
            if created:
                # Try to copy the icon from static images
                icon_path = f"static/images/{skill_data['icon_file']}"
                if os.path.exists(icon_path):
                    with open(icon_path, 'rb') as f:
                        skill.icon.save(
                            f"skills/{skill_data['icon_file']}",
                            ContentFile(f.read()),
                            save=True
                        )
                self.stdout.write(self.style.SUCCESS(f"✓ Created: {skill}"))
            else:
                self.stdout.write(f"→ Already exists: {skill}")

        self.stdout.write("Creating Services...")
        services_data = [
            {
                'number': 1,
                'title': 'Mobile App Design',
                'description': 'Crafting intuitive, high-performance mobile interfaces with a focus on Flutter and seamless user journeys.'
            },
            {
                'number': 2,
                'title': 'Brand Identity',
                'description': 'Defining the visual soul of your business through logos, typography, and cohesive brand systems.'
            },
            {
                'number': 3,
                'title': 'Web Development',
                'description': 'Building responsive, spacious, and fast web applications using Django and modern frontend frameworks.'
            },
            {
                'number': 4,
                'title': 'UI/UX Design',
                'description': 'User-centric prototyping in Figma to ensure every click and swipe feels natural and intentional.'
            },
            {
                'number': 5,
                'title': '3D Modelling',
                'description': 'Bringing products to life in 3D space using Blender for high-fidelity mockups and visual assets.'
            },
            {
                'number': 6,
                'title': 'Motion Graphics',
                'description': 'Adding life to brands with Adobe After Effects animations, from logo reveals to complex transitions.'
            }
        ]

        for service_data in services_data:
            service, created = Service.objects.get_or_create(
                number=service_data['number'],
                defaults={
                    'title': service_data['title'],
                    'description': service_data['description'],
                    'order': service_data['number']
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"✓ Created: {service}"))
            else:
                self.stdout.write(f"→ Already exists: {service}")

        self.stdout.write("Creating Gallery Items...")
        gallery_data = [
            {'src': 'images/michel-work-billboard.png', 'alt': 'Choco Glaze Billboard', 'col_span': 2, 'row_span': 1},
            {'src': 'images/michel-work-mobile.png', 'alt': 'Mobile App Mockup', 'col_span': 2, 'row_span': 2},
            {'src': 'images/michel-work-lanyard.png', 'alt': 'Campus Director Lanyard', 'col_span': 1, 'row_span': 1},
            {'src': 'images/michel-work-posters.png', 'alt': 'Campus Finals Posters', 'col_span': 1, 'row_span': 1},
        ]

        for idx, item_data in enumerate(gallery_data):
            gallery_item, created = GalleryItem.objects.get_or_create(
                alt_text=item_data['alt'],
                defaults={
                    'col_span': item_data['col_span'],
                    'row_span': item_data['row_span'],
                    'order': idx
                }
            )
            if created:
                # Try to copy the image from static
                image_path = item_data['src']
                if os.path.exists(image_path):
                    with open(image_path, 'rb') as f:
                        gallery_item.image.save(
                            image_path.replace('images/', 'gallery/'),
                            ContentFile(f.read()),
                            save=True
                        )
                self.stdout.write(self.style.SUCCESS(f"✓ Created: {gallery_item}"))
            else:
                self.stdout.write(f"→ Already exists: {gallery_item}")

        self.stdout.write(self.style.SUCCESS("\n✓ Portfolio data loaded successfully!"))
