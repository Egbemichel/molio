from django.contrib import admin
from django.utils.html import format_html, mark_safe
from django.utils.html import escape as html_escape
from config.admin_site import CustomModelAdmin
from .models import Skill, Education, Service, GalleryItem, Feedback


@admin.register(Skill)
class SkillAdmin(CustomModelAdmin):
    list_display = ('name', 'icon_preview', 'order')
    ordering = ('order',)
    fields = ('name', 'icon', 'order')
    
    def icon_preview(self, obj):
        if obj.icon:
            return format_html(
                '<img src="{}" style="height: 24px; width: auto; '
                'border-radius: 4px; object-fit: contain;" />',
                obj.icon.url
            )
        return '-'
    icon_preview.short_description = 'Icon'


@admin.register(Education)
class EducationAdmin(CustomModelAdmin):
    list_display = ('degree', 'school', 'current_badge', 'order')
    fields = ('degree', 'school', 'location', 'faculty', 'dates', 'is_current', 'order')
    ordering = ('order',)
    list_filter = ('is_current',)
    search_fields = ('degree', 'school', 'location')
    
    def current_badge(self, obj):
        if obj.is_current:
            return format_html(
                '<span style="background: rgba(82, 183, 136, 0.2); '
                'padding: 4px 8px; border-radius: 4px; color: #52b788; '
                'font-weight: 600; font-size: 12px;">{}</span>',
                '🎓 Current'
            )
        return '-'
    current_badge.short_description = 'Status'


@admin.register(Service)
class ServiceAdmin(CustomModelAdmin):
    list_display = ('service_number', 'title', 'description_preview', 'order')
    ordering = ('order', 'number')
    fields = ('number', 'title', 'description', 'order')
    list_filter = ('number',)
    search_fields = ('title', 'description')
    
    def service_number(self, obj):
        return format_html(
            '<span style="background: rgba(139, 30, 30, 0.2); padding: 4px 8px; '
            'border-radius: 4px; color: #8B1E1E; font-weight: 600; font-size: 12px;">'
            'Service {}</span>',
            str(obj.number).zfill(2)
        )
    service_number.short_description = 'Number'
    
    def description_preview(self, obj):
        desc = obj.description[:60] + '...' if len(obj.description) > 60 else obj.description
        escaped_desc = html_escape(desc)
        return mark_safe(
            f'<span style="color: rgba(232, 232, 232, 0.6); font-size: 12px;">{escaped_desc}</span>'
        )
    description_preview.short_description = 'Description'


@admin.register(GalleryItem)
class GalleryItemAdmin(CustomModelAdmin):
    list_display = ('alt_text', 'image_preview', 'layout_info', 'order')
    fields = ('image', 'alt_text', 'col_span', 'row_span', 'order')
    ordering = ('order',)
    list_filter = ('col_span', 'row_span')
    search_fields = ('alt_text',)
    
    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="height: 40px; width: auto; '
                'border-radius: 6px; object-fit: cover;" />',
                obj.image.url
            )
        return '-'
    image_preview.short_description = 'Preview'
    
    def layout_info(self, obj):
        return format_html(
            '<span style="background: rgba(100, 150, 200, 0.1); padding: 4px 8px; '
            'border-radius: 4px; color: #64b5f6; font-size: 12px;">{}x{}</span>',
            obj.col_span, obj.row_span
        )
    layout_info.short_description = 'Grid Size'


@admin.register(Feedback)
class FeedbackAdmin(CustomModelAdmin):
    list_display = ('rating_stars', 'message_preview', 'created_at')
    fields = ('rating', 'message', 'created_at')
    ordering = ('-created_at',)
    list_filter = ('rating', 'created_at')
    search_fields = ('message',)
    readonly_fields = ('created_at',)
    
    def rating_stars(self, obj):
        stars = '★' * obj.rating + '☆' * (5 - obj.rating)
        colors = ['#d32f2f', '#f57c00', '#fbc02d', '#7b1fa2', '#8B1E1E']
        color = colors[obj.rating - 1]
        return format_html(
            '<span style="color: {}; font-size: 14px; letter-spacing: 2px;">{}</span>',
            color,
            stars
        )
    rating_stars.short_description = 'Rating'
    
    def message_preview(self, obj):
        preview = obj.message[:50] + '...' if len(obj.message) > 50 else obj.message
        escaped = html_escape(preview)
        return mark_safe(
            f'<span style="color: rgba(232, 232, 232, 0.6); font-size: 12px;">{escaped}</span>'
        )
    message_preview.short_description = 'Message'