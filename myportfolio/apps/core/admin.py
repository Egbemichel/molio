from django.contrib import admin, messages
from django.shortcuts import redirect, render
from django.urls import path, reverse
from django.utils.html import format_html, mark_safe
from django.utils.html import escape as html_escape
from django import forms
from unfold.admin import StackedInline
from config.admin_site import CustomModelAdmin
from .devicon import DeviconUnavailable, get_catalog
from .models import Skill, Education, EducationGallery, Service, GalleryItem, Feedback, Resume


class EducationGalleryForm(forms.ModelForm):
    """Custom form for the gallery inline. Size/type validation is handled
    centrally by CompressedImageField (which also accepts iPhone HEIC), so no
    per-form clean is needed here — just the friendlier file widget."""
    class Meta:
        model = EducationGallery
        fields = ('image', 'order')
        widgets = {
            'image': forms.FileInput(attrs={
                'accept': 'image/*',
                'class': 'vFileField',
            }),
            'order': forms.NumberInput(attrs={
                'class': 'vIntegerField',
            }),
        }


class EducationGalleryInline(StackedInline):
    model = EducationGallery
    form = EducationGalleryForm
    extra = 1
    fields = ('image', 'image_preview', 'order')
    readonly_fields = ('image_preview',)
    ordering = ('order',)
    
    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="height: 200px; width: auto; '
                'border-radius: 4px; object-fit: cover;" />',
                obj.image.url
            )
        return 'No image yet'
    image_preview.short_description = 'Preview'


@admin.register(Skill)
class SkillAdmin(CustomModelAdmin):
    list_display = ('name', 'icon_preview', 'source_badge', 'order')
    ordering = ('order', 'name')
    fields = ('name', 'icon', 'order')
    search_fields = ('name', 'slug')

    def icon_preview(self, obj):
        src = obj.icon_src
        if src:
            return format_html(
                '<img src="{}" style="height: 24px; width: auto; '
                'border-radius: 4px; object-fit: contain;" />',
                src
            )
        return '-'
    icon_preview.short_description = 'Icon'

    def source_badge(self, obj):
        if obj.slug:
            return mark_safe(
                '<span style="background: rgba(139,30,30,0.12); padding: 3px 8px; '
                'border-radius: 4px; color: #8B1E1E; font-size: 11px;">catalog</span>'
            )
        return mark_safe('<span style="color: rgba(232,232,232,0.4); font-size: 11px;">uploaded</span>')
    source_badge.short_description = 'Source'

    # ── catalog picker ──────────────────────────────────────────────────────
    def get_urls(self):
        return [
            path(
                'catalog/',
                self.admin_site.admin_view(self.catalog_view),
                name='core_skill_catalog',
            ),
        ] + super().get_urls()

    def catalog_view(self, request):
        """Toggle skills on/off from the Devicon catalog — no uploads needed."""
        changelist_url = reverse('admin:core_skill_changelist')

        if request.method == 'POST':
            selected = set(request.POST.getlist('slugs'))
            try:
                catalog = {item['slug']: item for item in get_catalog()}
            except DeviconUnavailable:
                messages.error(request, 'Could not reach the icon catalog. Nothing was changed.')
                return redirect(changelist_url)

            existing = {s.slug: s for s in Skill.objects.exclude(slug__isnull=True)}

            # Turn on anything newly ticked.
            added = 0
            for slug in selected - existing.keys():
                item = catalog.get(slug)
                if not item:
                    continue
                Skill.objects.create(
                    name=item['label'],
                    slug=item['slug'],
                    variant=item['variant'],
                    icon_url=item['url'],
                )
                added += 1

            # Turn off anything unticked. Only catalog-sourced skills are ever
            # removed here — skills you uploaded by hand are never touched.
            removed, _ = Skill.objects.filter(slug__in=(existing.keys() - selected)).delete()

            if added or removed:
                bits = []
                if added:
                    bits.append(f'{added} added')
                if removed:
                    bits.append(f'{removed} removed')
                messages.success(request, 'Skills updated — ' + ', '.join(bits) + '.')
            else:
                messages.info(request, 'No changes to save.')
            return redirect(changelist_url)

        # GET — render the grid, or a proper error state if the CDN is down.
        error = None
        catalog = []
        try:
            catalog = get_catalog(force_refresh='refresh' in request.GET)
        except DeviconUnavailable as exc:
            error = str(exc)

        selected = set(
            Skill.objects.exclude(slug__isnull=True).values_list('slug', flat=True)
        )

        context = {
            **self.admin_site.each_context(request),
            'title': 'Skill catalog',
            'catalog': catalog,
            'selected': selected,
            'error': error,
            'opts': self.model._meta,
            'changelist_url': changelist_url,
        }
        return render(request, 'admin/core/skill/catalog.html', context)


@admin.register(Education)
class EducationAdmin(CustomModelAdmin):
    list_display = ('degree', 'school', 'gallery_count', 'current_badge', 'order')
    fields = ('degree', 'school', 'location', 'faculty', 'dates', 'is_current', 'order')
    ordering = ('order',)
    list_filter = ('is_current',)
    search_fields = ('degree', 'school', 'location')
    inlines = [EducationGalleryInline]
    
    def gallery_count(self, obj):
        count = obj.gallery_images.count()
        return format_html(
            '<span style="background: rgba(139, 30, 30, 0.1); '
            'padding: 4px 8px; border-radius: 4px; color: #8B1E1E;">{} image(s)</span>',
            count
        )
    gallery_count.short_description = 'Gallery Images'
    
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
    list_display = ('service_number', 'title', 'image_preview', 'description_preview', 'order')
    ordering = ('order', 'number')
    fields = ('number', 'title', 'description', 'image', 'order')
    list_filter = ('number',)
    search_fields = ('title', 'description')

    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="height: 40px; width: auto; '
                'border-radius: 6px; object-fit: cover;" />',
                obj.image.url
            )
        return '-'
    image_preview.short_description = 'Illustration'

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
    list_display = ('name', 'email_display', 'rating_stars', 'message_preview', 'image_preview', 'created_at')
    fields = ('name', 'email', 'rating', 'message', 'image', 'created_at')
    ordering = ('-created_at',)
    list_filter = ('rating', 'created_at')
    search_fields = ('name', 'email', 'message')
    readonly_fields = ('created_at',)
    
    def email_display(self, obj):
        return format_html(
            '<a href="mailto:{}">{}</a>',
            obj.email,
            obj.email
        )
    email_display.short_description = 'Email'
    
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
    
    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="height: 30px; width: 30px; border-radius: 50%; object-fit: cover;" />',
                obj.image.url
            )
        return '-'
    image_preview.short_description = 'Image'


@admin.register(Resume)
class ResumeAdmin(CustomModelAdmin):
    list_display = ('label', 'active_badge', 'download_link', 'updated_at')
    fields = ('label', 'file', 'is_active')
    list_filter = ('is_active',)
    ordering = ('-updated_at',)

    def active_badge(self, obj):
        if obj.is_active:
            return mark_safe(
                '<span style="background: rgba(82, 183, 136, 0.2); padding: 4px 8px; '
                'border-radius: 4px; color: #52b788; font-weight: 600; font-size: 12px;">Active</span>'
            )
        return mark_safe('<span style="color: rgba(232,232,232,0.4); font-size: 12px;">inactive</span>')
    active_badge.short_description = 'Status'

    def download_link(self, obj):
        # Use the signed delivery URL — the plain Cloudinary URL 401s when the
        # account restricts PDF delivery ("deny or ACL failure").
        url = obj.delivery_url() if obj.pk else None
        if url:
            return format_html('<a href="{}" target="_blank" rel="noopener">Open file ↗</a>', url)
        return '-'
    download_link.short_description = 'File'