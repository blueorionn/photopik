"""Email delivery via AWS SES."""

import botocore.exceptions
from flask import current_app


def send_email(to: str, subject: str, body: str) -> dict | None:
    """Send a plain-text email through SES.

    Returns the SES response dict on success, None on failure. Failures
    (rejected address, throttling, network) are logged and swallowed so
    callers such as the magic-link request endpoint can keep returning
    uniform responses instead of leaking errors.
    """
    try:
        ses = current_app.extensions["ses"]
        return ses.send_email(
            FromEmailAddress=current_app.config["SES_SENDER"],
            Destination={"ToAddresses": [to]},
            Content={
                "Simple": {
                    "Subject": {"Data": subject},
                    "Body": {"Text": {"Data": body}},
                }
            },
        )
    except botocore.exceptions.BotoCoreError as exc:
        current_app.logger.error("SES send to %s failed: %s", to, exc)
        return None
