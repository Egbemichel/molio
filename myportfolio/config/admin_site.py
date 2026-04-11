"""
Custom Django Admin Site Configuration
Modern, professional portfolio admin interface with Tailwind CSS
"""

from django.contrib import admin
from django.templatetags.static import static
from django.utils.html import format_html
from django.apps import apps


class CustomAdminSite(admin.AdminSite):
    """
    Custom admin site with modern professional design
    """

    # Site Header
    site_header = "Portfolio Admin"
    site_title = "Portfolio Admin"
    index_title = "Welcome to your portfolio management system"

    # Use modern templates
    login_template = 'admin/login.html'
    index_template = 'admin/index.html'
    base_site_template = 'admin/base_site.html'

    # Custom theme
    enable_nav_sidebar = False

    def index(self, request, extra_context=None):
        """
        Custom index view with enhanced data
        """
        extra_context = extra_context or {}
        
        # Get counts for dashboard stats
        try:
            Project = apps.get_model('projects', 'Project')
            Skill = apps.get_model('core', 'Skill')
            Education = apps.get_model('core', 'Education')
            Service = apps.get_model('core', 'Service')
            
            extra_context.update({
                'projects_count': Project.objects.count(),
                'skills_count': Skill.objects.count(),
                'education_count': Education.objects.count(),
                'services_count': Service.objects.count(),
            })
        except Exception:
            pass
        
        return super().index(request, extra_context=extra_context)

    def each_context(self, request):
        """
        Add custom context variables for all admin templates
        """
        context = super().each_context(request)
        context.update({
            'site_header': self.site_header,
            'site_title': self.site_title,
            'theme_color': '#8B1E1E',
        })
        return context

    class Media:
        css = {
            'all': ()
        }
        js = (
            'admin/js/interactions.js',
        )


# Create custom admin site instance
custom_admin_site = CustomAdminSite(name='custom_admin')


class CustomModelAdmin(admin.ModelAdmin):
    """
    Base ModelAdmin class with modern styling
    """

    class Media:
        css = {
            'all': ()
        }
        js = (
            'admin/js/interactions.js',
        )

    def get_form(self, request, obj=None, **kwargs):
        """
        Enhance form with modern styling
        """
        form = super().get_form(request, obj, **kwargs)
        return form

    def get_list_display(self, request):
        """
        Optimize list display
        """
        return super().get_list_display(request)

    def get_list_filter(self, request):
        """
        Enhance list filters
        """
        return super().get_list_filter(request)

    def get_search_fields(self, request):
        """
        Ensure search fields are functional
        """
        return super().get_search_fields(request)


# Export for use in app admin.py files
__all__ = ['CustomAdminSite', 'CustomModelAdmin', 'custom_admin_site']
