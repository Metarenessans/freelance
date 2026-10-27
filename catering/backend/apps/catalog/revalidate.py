import os
import json
import logging
import threading
import urllib.request
from django.conf import settings

logger = logging.getLogger(__name__)


def notify_frontend_revalidate(event_type: str = "all", slug: str = ""):
    if os.getenv("REVALIDATION_ENABLED", "false").lower() != "true":
        return
    """
    Send a webhook to the Next.js frontend to lazily invalidate structured data and page caches.
    In serverless environments (Vercel), dispatches inline to avoid frozen background threads.
    """
    def _send():
        try:
            from apps.system_settings.models import SystemSettings
            sys_settings = SystemSettings.load()
            frontend_url = sys_settings.get_frontend_url() or getattr(settings, "FRONTEND_URL", "https://catering-portfolio-six.vercel.app")
            secret = sys_settings.get_revalidation_secret() or getattr(settings, "REVALIDATION_SECRET", "")
            url = f"{frontend_url.rstrip('/')}/api/revalidate-schema"

            payload = json.dumps({
                "secret": secret,
                "type": event_type,
                "slug": slug,
            }).encode("utf-8")

            req = urllib.request.Request(
                url,
                data=payload,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=3) as resp:
                if resp.status == 200:
                    logger.info(f"Frontend revalidation triggered successfully for {event_type}:{slug}")
                else:
                    logger.warning(f"Frontend revalidation returned status {resp.status}")
        except Exception as e:
            # Do not propagate errors: frontend network failures must never break the Django admin
            logger.warning(f"Could not notify frontend about revalidation ({event_type}:{slug}): {e}")

    if os.getenv("VERCEL"):
        _send()
        return

    threading.Thread(target=_send, daemon=True).start()
