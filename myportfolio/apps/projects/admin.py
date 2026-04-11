from django.contrib import admin
from django.utils.html import format_html
from config.admin_site import CustomModelAdmin
from .models import Project, Category, TechStack


class ProjectInline(admin.TabularInline):
    """Inline admin for projects within categories"""
    model = Project
    extra = 1
    fields = ('title', 'role', 'github_link', 'technologies', 'featured')
    filter_horizontal = ('technologies',)


@admin.register(TechStack)
class TechStackAdmin(CustomModelAdmin):
    """Admin interface for Technology Stack items"""
    list_display = ('name', 'tech_image', 'usage_count')
    search_fields = ('name',)
    fields = ('name', 'image')
    
    def tech_image(self, obj):
        """Display thumbnail of tech stack image"""
        if obj.image:
            return format_html(
                '<img src="{}" style="height: 30px; width: auto; '
                'border-radius: 4px; object-fit: contain;" />',
                obj.image.url
            )
        return '-'
    tech_image.short_description = 'Logo'
    
    def usage_count(self, obj):
        """Display how many projects use this tech"""
        count = obj.project_set.count()
        return format_html(
            '<span style="background: rgba(139, 30, 30, 0.1); padding: 4px 8px; '
            'border-radius: 4px; color: rgba(232, 232, 232, 0.7); font-size: 12px;">'
            '{} projects</span>',
            count
        )
    usage_count.short_description = 'Usage'


@admin.register(Category)
class CategoryAdmin(CustomModelAdmin):
    """Admin interface for Project Categories"""
    list_display = ('name', 'project_count', 'order')
    list_editable = ('order',)
    list_filter = ('order',)
    search_fields = ('name',)
    fields = ('name', 'order')
    inlines = [ProjectInline]
    
    def project_count(self, obj):
        """Display count of projects in this category"""
        count = obj.projects.count()
        return format_html(
            '<span style="background: rgba(139, 30, 30, 0.2); padding: 4px 8px; '
            'border-radius: 4px; color: #8B1E1E; font-weight: 600;">{} projects</span>',
            count
        )
    project_count.short_description = 'Projects'


@admin.register(Project)
class ProjectAdmin(CustomModelAdmin):
    """Enhanced admin interface for Projects with dark theme styling"""
    
    # List view configuration
    list_display = ('title', 'category', 'featured', 'tech_count', 'order', 'created_at_formatted')
    list_editable = ('category', 'featured', 'order')
    list_filter = ('category', 'featured', 'created_at')
    search_fields = ('title', 'description', 'role')
    
    # Auto-fills the slug based on the title
    prepopulated_fields = {'slug': ('title',)}
    filter_horizontal = ('technologies',)
    
    # Enhanced fieldset organization
    fieldsets = (
        ('Basic Info', {
            'fields': ('category', 'title', 'slug', 'role', 'date_range'),
            'description': 'Project identification and timeline'
        }),
        ('Content', {
            'fields': ('description', 'points', 'github_link'),
            'description': 'Project description and links'
        }),
        ('Media', {
            'fields': ('logo', 'mockup', 'technologies'),
            'description': 'Images and associated technologies'
        }),
        ('Publishing', {
            'fields': ('featured', 'order'),
            'classes': ('collapse',),
            'description': 'Visibility and ordering settings'
        }),
    )
    
    readonly_fields = ('created_at_display',)
    
    def tech_count(self, obj):
        """Display technology count with color coding"""
        count = obj.technologies.count()
        if count > 0:
            color = '#52b788' if count >= 3 else '#64b5f6'
            bg = 'rgba(82, 183, 136, 0.1)' if count >= 3 else 'rgba(100, 150, 200, 0.1)'
            return format_html(
                '<span style="background: {}; padding: 4px 8px; border-radius: 4px; '
                'color: {}; font-weight: 600; font-size: 12px;">{} tech</span>',
                bg, color, count
            )
        return '-'
    tech_count.short_description = 'Tech Stack'
    
    def created_at_formatted(self, obj):
        """Display formatted creation date"""
        return obj.created_at.strftime('%b %d, %Y')
    created_at_formatted.short_description = 'Created'
    created_at_formatted.admin_order_field = 'created_at'
    
    def created_at_display(self, obj):
        """Display full creation timestamp in form"""
        return obj.created_at.strftime('%B %d, %Y at %I:%M %p')
    created_at_display.short_description = 'Created At'
    
    class Media:
        css = {'all': ('admin/css/dark_admin.css',)}
        js = ('admin/js/interactions.js',)
