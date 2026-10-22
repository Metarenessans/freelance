"""Portfolio submission and notification policy."""
import os


def portfolio_enabled():
    val = os.getenv("PORTFOLIO_ORDERING_ENABLED")
    if val is not None:
        return val.lower() == "true"
    return os.getenv("DEMO_MODE", "false").lower() != "true"


def demo_mode():
    return os.getenv("DEMO_MODE", "false").lower() == "true"


def outbound_disabled():
    return os.getenv("OUTBOUND_NOTIFICATIONS_DISABLED", "false").lower() == "true"


def submissions_enabled():
    if demo_mode() and not portfolio_enabled():
        return False
    return os.getenv("SUBMISSIONS_DISABLED", "false").lower() != "true"
