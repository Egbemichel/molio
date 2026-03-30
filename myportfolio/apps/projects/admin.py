from django.contrib import admin
from .models import Project, Category, TechStack

class ProjectInline(admin.TabularInline):
    model = Project
    extra = 1
    # Add this line to the inline so the fields appear there too!
    fields = ('title', 'role', 'github_link', 'technologies', 'featured')
    filter_horizontal = ('technologies',)

@admin.register(TechStack)
class TechStackAdmin(admin.ModelAdmin):
    list_display = ('name',)

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'order')
    list_editable = ('order',)
    inlines = [ProjectInline]

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    # Added 'category' to list_display so you can see which group it's in
    list_display = ('title', 'category', 'featured', 'order', 'created_at')
    
    # Allows you to change category and order directly from the list view
    list_editable = ('category', 'featured', 'order')
    
    # Auto-fills the slug based on the title
    prepopulated_fields = {'slug': ('title',)}
    
    # Adding a sidebar filter for categories
    list_filter = ('category', 'featured')
    
    search_fields = ('title', 'description', 'role')

    filter_horizontal = ('technologies',)
    
    # Organizing the editor layout for better workflow
    fieldsets = (
        ('Basic Info', {
            'fields': ('category', 'title', 'slug', 'role', 'date_range')
        }),
        ('Content', {
            'fields': ('description', 'points', 'github_link')
        }),
        ('Media', {
            'fields': ('logo', 'mockup', 'technologies')
        }),
        ('Settings', {
            'fields': ('featured', 'order')
        }),
    )
