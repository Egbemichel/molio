"""
Reusable image handling so uploads stay fast and never take the app down.

`compress_image()` downsizes + recompresses an uploaded image BEFORE it is sent
to storage (Cloudinary in production). Phone photos are typically 3-10 MB;
scaled to <= 1600px on the long edge they become a few hundred KB, so:

  * the upload to Cloudinary finishes in a fraction of the time — several images
    saved together no longer blow past the worker timeout,
  * the instance uses far less memory (it matters on small free tiers), and
  * the delivered images are lighter, so the public site paints faster.

`CompressedImageField` applies this automatically whenever a new file is saved,
and degrades gracefully: if a file isn't a decodable raster image, or Pillow
errors for any reason, the ORIGINAL file is stored untouched rather than raising
— a save can always succeed.
"""
import io
import logging
import os

from django.core.files.base import ContentFile
from django.db.models import ImageField

logger = logging.getLogger(__name__)

# Longest edge, in pixels, that an image is allowed to keep. Larger images are
# scaled down proportionally. 1600px is crisp for full-bleed display + retina.
MAX_EDGE = 1600
# JPEG quality for photographic (opaque) images. 82 is visually lossless-ish.
QUALITY = 82


def compress_image(file_obj, max_edge=MAX_EDGE, quality=QUALITY):
    """Return a (usually smaller) Django file for `file_obj`.

    Transparency is preserved as PNG; opaque photos become progressive JPEGs.
    Never raises for image reasons — on any problem the original file is
    returned unchanged so the surrounding save still works.
    """
    try:
        from PIL import Image, ImageOps, ImageFile
        # Some phone exports are slightly truncated; decode what we can.
        ImageFile.LOAD_TRUNCATED_IMAGES = True
    except Exception:
        return file_obj

    original_size = getattr(file_obj, 'size', None)

    try:
        file_obj.seek(0)
        img = Image.open(file_obj)
        img.load()
    except Exception:
        # Not something Pillow can read (SVG, HEIC without plugin, corrupt…).
        _rewind(file_obj)
        return file_obj

    try:
        # Honour the camera's EXIF orientation, then discard the metadata.
        img = ImageOps.exif_transpose(img)

        has_alpha = img.mode in ('RGBA', 'LA') or (
            img.mode == 'P' and 'transparency' in img.info
        )

        width, height = img.size
        longest = max(width, height)
        resized = False
        if longest > max_edge:
            scale = max_edge / float(longest)
            img = img.resize(
                (max(1, round(width * scale)), max(1, round(height * scale))),
                Image.LANCZOS,
            )
            resized = True

        buffer = io.BytesIO()
        if has_alpha:
            img = img.convert('RGBA')
            img.save(buffer, format='PNG', optimize=True)
            new_ext = '.png'
        else:
            img = img.convert('RGB')
            img.save(buffer, format='JPEG', quality=quality,
                     optimize=True, progressive=True)
            new_ext = '.jpg'

        data = buffer.getvalue()

        # If we didn't resize and didn't actually shrink the bytes, keep the
        # original (avoids re-encoding an already-tiny, optimized icon larger).
        if not resized and original_size is not None and len(data) >= original_size:
            _rewind(file_obj)
            return file_obj

        base = os.path.splitext(os.path.basename(getattr(file_obj, 'name', '') or 'image'))[0]
        return ContentFile(data, name=(base or 'image') + new_ext)
    except Exception:
        logger.exception('compress_image failed; storing the original file')
        _rewind(file_obj)
        return file_obj


def _rewind(file_obj):
    try:
        file_obj.seek(0)
    except Exception:
        pass


class CompressedImageField(ImageField):
    """Drop-in ImageField that compresses new uploads before they hit storage.

    The heavy work happens once, on save, and only for a freshly-uploaded file
    (an unchanged image on an edit is left alone). Deconstructs to itself, so no
    special migration handling is needed.
    """

    def pre_save(self, model_instance, add):
        file = getattr(model_instance, self.attname)
        # A newly-uploaded file is not yet committed to storage; that is exactly
        # (and only) when we want to rewrite it.
        if file and not getattr(file, '_committed', True):
            try:
                content = file.file
                compressed = compress_image(content)
                if compressed is not content:
                    base, _old_ext = os.path.splitext(file.name)
                    new_ext = os.path.splitext(compressed.name)[1]
                    file.file = compressed
                    file.name = base + new_ext
            except Exception:
                # Never let optimisation break a save — fall back to the original.
                logger.exception('CompressedImageField.pre_save failed; storing original')
        # super() (FileField.pre_save) performs the actual storage upload.
        return super().pre_save(model_instance, add)
