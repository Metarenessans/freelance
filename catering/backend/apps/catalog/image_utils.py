import os
import logging
from io import BytesIO
from PIL import Image, ImageOps
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import UploadedFile

logger = logging.getLogger(__name__)


def optimize_image_to_webp(image_field, max_size=1600, quality=82):
    """
    Convert an image to WebP with a maximum resolution limit.
    Automatically correct EXIF orientation and preserve the alpha channel.
    """
    if not image_field or not hasattr(image_field, "file"):
        return

    name = image_field.name or ""
    base, ext = os.path.splitext(name)

    # Do not recompress WebP files already saved on disk
    if ext.lower() == ".webp" and not isinstance(image_field.file, UploadedFile):
        return

    try:
        image_field.file.seek(0)
        with Image.open(image_field.file) as im:
            # Correct orientation using smartphone EXIF metadata
            im = ImageOps.exif_transpose(im)

            if im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info):
                out_im = im.convert("RGBA")
            elif im.mode != "RGB":
                out_im = im.convert("RGB")
            else:
                out_im = im

            w, h = out_im.size
            if max(w, h) > max_size:
                ratio = float(max_size) / max(w, h)
                new_w = int(w * ratio)
                new_h = int(h * ratio)
                out_im = out_im.resize((new_w, new_h), Image.Resampling.LANCZOS)

            buffer = BytesIO()
            out_im.save(buffer, "WEBP", quality=quality, method=6)
            buffer.seek(0)

            new_filename = f"{base}.webp"
            image_field.save(new_filename, ContentFile(buffer.read()), save=False)
    except Exception as e:
        logger.warning("Error optimizing image %s to WebP: %s", name, e)

