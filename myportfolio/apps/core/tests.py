import tempfile
from pathlib import Path

from django.core.management import call_command
from django.test import TestCase, override_settings

from django.contrib.auth import get_user_model

from apps.projects.models import Category, Project, ProjectChapter


def make_project(**kwargs):
    category, _ = Category.objects.get_or_create(name='Brand identity')
    defaults = {
        'title': 'Corner café identity',
        'slug': 'corner-cafe',
        'category': category,
        'hook': 'A brand that has to work on a cup, a sign and a phone.',
        'published': True,
    }
    defaults.update(kwargs)
    return Project.objects.create(**defaults)


class HomePageTests(TestCase):
    def test_home_renders_the_brand_pieces(self):
        make_project()
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        html = response.content.decode()
        # The slogan, for people and for assistive tech.
        self.assertIn('always chasing the next idea worth bringing to life', html)
        # Dot stops the travelling dot uses, and the logomark it rests in.
        for stop in ('data-dot-stop="hero"', 'data-dot-stop="about-period"', 'data-dot-stop="work"', 'data-logo-dot'):
            self.assertIn(stop, html)
        self.assertContains(response, 'Corner café identity')
        self.assertContains(response, '/work/corner-cafe/')

    def test_unpublished_and_uncategorised_work_stays_hidden(self):
        make_project(slug='draft', title='Draft thing', published=False)
        make_project(slug='loose', title='Loose thing', category=None)
        response = self.client.get('/')
        self.assertNotContains(response, 'Draft thing')
        self.assertNotContains(response, 'Loose thing')

    def test_home_without_any_content(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'New work is being written up')


class ProjectPageTests(TestCase):
    def test_project_page_tells_the_story_in_chapters(self):
        project = make_project(starting_point='What the client had.', outcome='What shipped.')
        for i, title in enumerate(['The thought', 'The brand', 'The experience']):
            ProjectChapter.objects.create(project=project, title=title, body=f'{title} body', order=i)
        response = self.client.get('/work/corner-cafe/')
        self.assertEqual(response.status_code, 200)
        html = response.content.decode()
        self.assertLess(html.index('The thought'), html.index('The brand'))
        self.assertLess(html.index('The brand'), html.index('The experience'))
        self.assertIn('What the client had.', html)
        self.assertIn('What shipped.', html)

    def test_project_page_is_its_own_world(self):
        make_project(world_bg='#C7F000', world_display_font='Anton', palette=[{'hex': '#C7F000', 'name': 'Acid'}])
        ProjectChapter.objects.create(project=Project.objects.get(), title='The brand', layout='specimen')
        html = self.client.get('/work/corner-cafe/').content.decode()
        self.assertIn('--w-bg:#C7F000', html)
        self.assertIn('family=Anton', html)
        self.assertIn('Acid', html)                    # the specimen palette
        self.assertIn('data-dot-stop="title"', html)   # the red dot crosses over

    def test_every_layout_renders(self):
        project = make_project()
        layouts = ['wall', 'split', 'fullbleed', 'specimen', 'gallery', 'statement', 'pillars']
        for i, layout in enumerate(layouts):
            ProjectChapter.objects.create(project=project, title=f'Step {layout}', layout=layout,
                                          body='Title: text', order=i)
        response = self.client.get('/work/corner-cafe/')
        self.assertEqual(response.status_code, 200)
        for layout in layouts:
            self.assertContains(response, f'chapter--{layout}')

    def test_unpublished_project_is_404(self):
        make_project(published=False)
        self.assertEqual(self.client.get('/work/corner-cafe/').status_code, 404)


# The build renders with HTTP_HOST=localhost and repoints STATIC_ROOT; keep both
# contained to this test.
@override_settings(ALLOWED_HOSTS=['*'], STATIC_ROOT=None)
class BuildStaticTests(TestCase):
    def test_build_writes_home_404_and_project_pages(self):
        make_project()
        with tempfile.TemporaryDirectory() as out:
            call_command('build_static', out=out, verbosity=0)
            out = Path(out)
            self.assertTrue((out / 'index.html').exists())
            self.assertTrue((out / '404.html').exists())
            self.assertTrue((out / 'work' / 'corner-cafe' / 'index.html').exists())
            self.assertTrue((out / 'static' / 'brand' / 'logos' / '21.svg').exists())


class AdminDefaultStepsTests(TestCase):
    def setUp(self):
        user = get_user_model().objects.create_superuser('mich', 'm@example.com', 'pw-for-tests-only')
        self.client.force_login(user)

    def _create(self, category_name, slug):
        category = Category.objects.create(name=category_name)
        r = self.client.post('/admin/projects/project/add/', {
            'category': category.pk, 'title': slug, 'slug': slug, 'points': '[]', 'palette': '[]',
            'world_preset': 'paper', 'world_hero': 'poster', 'published': 'on', 'order': 0,
            'chapters-TOTAL_FORMS': 0, 'chapters-INITIAL_FORMS': 0,
        })
        self.assertEqual(r.status_code, 302)
        return Project.objects.get(slug=slug)

    def test_new_projects_get_three_steps(self):
        design = self._create('Brand identity', 'a-brand')
        self.assertEqual([c.title for c in design.chapters.all()], ['The thought', 'The brand', 'The experience'])
        dev = self._create('Fullstack', 'an-app')
        self.assertEqual([c.title for c in dev.chapters.all()], ['The itch', 'The rabbit hole', 'The souvenirs'])
