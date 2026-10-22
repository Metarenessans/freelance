"""Bounded JSON creates and shared order/quote throttles; never throttle staff reads."""
from datetime import datetime, timezone as datetime_timezone

from django.db.models import F
from django.utils import timezone
from django.utils.crypto import salted_hmac
from rest_framework.exceptions import APIException
from rest_framework.parsers import JSONParser
from rest_framework.throttling import BaseThrottle

from .models import SubmissionRateBucket
from .portfolio import submissions_enabled


class PayloadTooLarge(APIException):
    status_code = 413
    default_detail = "Submission must be no larger than 64 KiB."


class BoundedJSONParser(JSONParser):
    def parse(self, stream, media_type=None, parser_context=None):
        import io
        data = stream.read(65537)
        if len(data) > 65536:
            raise PayloadTooLarge()
        return super().parse(io.BytesIO(data), media_type, parser_context)


class SubmissionBurstThrottle(BaseThrottle):
    limit = 5
    seconds = 60

    def allow_request(self, request, view):
        if view.action != "create" or not submissions_enabled():
            return True
        now = timezone.now()
        epoch = int(now.timestamp())
        bucket = epoch // self.seconds
        self.remaining = self.seconds - epoch % self.seconds
        # Never trust caller-supplied forwarded headers or store raw peer addresses.
        peer = request.META.get("REMOTE_ADDR", "unknown")
        key = salted_hmac("portfolio-submission", f"{peer}:{self.seconds}:{bucket}", algorithm="sha256").hexdigest()
        SubmissionRateBucket.objects.filter(expires_at__lte=now).delete()
        SubmissionRateBucket.objects.get_or_create(
            key=key, defaults={"count": 0, "expires_at": datetime.fromtimestamp((bucket + 1) * self.seconds, datetime_timezone.utc)},
        )
        # Atomic conditional update enforces the cap across workers, not just a local cache.
        return bool(SubmissionRateBucket.objects.filter(key=key, count__lt=self.limit).update(count=F("count") + 1))

    def wait(self):
        return self.remaining


class SubmissionDailyThrottle(SubmissionBurstThrottle):
    limit = 30
    seconds = 86400


class PublicSubmissionMixin:
    parser_classes = [BoundedJSONParser]

    def get_throttles(self):
        if self.action == "create":
            return [SubmissionBurstThrottle(), SubmissionDailyThrottle()]
        return []
