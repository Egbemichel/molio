from django.contrib import admin, messages
from django.shortcuts import redirect
from django.urls import path
from django.utils.html import format_html, mark_safe
from config.admin_site import CustomModelAdmin
from .models import Project, Category, TechStack
from .github_sync import sync_github_repos


class ProjectInline(admin.TabularInline):
    """Inline admin for projects within categories"""
    model = Project
    extra = 1
    fields = ('title', 'role', 'github_link', 'technologies', 'featured')
    filter_horizontal = ('technologies',)


@admin.register(TechStack)
class TechStackAdmin(CustomModelAdmin):
    """Admin interface for Technology Stack items"""
    list_display = ('name', 'tech_image', 'logo_source', 'usage_count')
    search_fields = ('name',)
    fields = ('name', 'icon_url', 'image')

    def tech_image(self, obj):
        """Thumbnail of the tech logo (Devicon URL or uploaded override)."""
        src = obj.icon_src
        if src:
            return format_html(
                '<img src="{}" style="height: 30px; width: auto; '
                'border-radius: 4px; object-fit: contain;" />',
                src
            )
        return '-'
    tech_image.short_description = 'Logo'

    def logo_source(self, obj):
        if obj.image:
            return mark_safe('<span style="font-size: 11px; opacity: 0.6;">uploaded</span>')
        if obj.icon_url:
            return mark_safe(
                '<span style="background: rgba(139,30,30,0.12); padding: 3px 8px; '
                'border-radius: 4px; color: #8B1E1E; font-size: 11px;">devicon</span>'
            )
        return mark_safe('<span style="color: rgba(232,232,232,0.4); font-size: 11px;">none</span>')
    logo_source.short_description = 'Source'
    
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
    
    # Projects-only changelist template adds the "Sync from GitHub" button
    change_list_template = 'admin/projects/project/change_list.html'

    # List view configuration
    list_display = ('title', 'category', 'published', 'featured', 'tech_count', 'order', 'created_at_formatted')
    list_editable = ('category', 'published', 'featured', 'order')
    list_filter = ('published', 'is_github_managed', 'category', 'featured', 'created_at')
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
            'fields': ('description', 'points', 'github_link', 'live_url'),
            'description': 'Project description and links'
        }),
        ('Media', {
            'fields': ('logo', 'mockup', 'technologies'),
            'description': 'Images and associated technologies'
        }),
        ('Publishing', {
            'fields': ('published', 'featured', 'order'),
            'description': 'Unpublished projects are hidden from the public site'
        }),
        ('GitHub Sync', {
            'fields': ('is_github_managed', 'github_repo_id', 'last_synced_at'),
            'classes': ('collapse',),
            'description': 'Auto-populated by the GitHub sync'
        }),
    )

    readonly_fields = ('created_at_display', 'github_repo_id', 'last_synced_at', 'is_github_managed')

    def get_urls(self):
        urls = super().get_urls()
        custom = [
            path(
                'sync-github/',
                self.admin_site.admin_view(self.sync_github_view),
                name='projects_project_sync_github',
            ),
        ]
        return custom + urls

    def sync_github_view(self, request):
        """Run the GitHub sync, then return to the changelist with a message."""
        if request.method != 'POST':
            return redirect('admin:projects_project_changelist')
        try:
            summary = sync_github_repos()
            self.message_user(
                request,
                f"GitHub sync complete: {summary['created']} created, "
                f"{summary['updated']} updated ({summary['total_repos']} repos scanned). "
                "New projects are drafts — finish them, then publish.",
                level=messages.SUCCESS,
            )
        except Exception as exc:  # surface API/credential errors to the admin
            self.message_user(request, f"GitHub sync failed: {exc}", level=messages.ERROR)
        return redirect('admin:projects_project_changelist')
    
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
