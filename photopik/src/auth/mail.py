from flask import current_app


def send_email(to, subject, body):
    ses = current_app.extensions["ses"]

    return ses.send_email(
        FromEmailAddress=current_app.config["SES_SENDER"],
        Destination={"ToAddresses": [to]},
        Content={
            "Simple": {"Subject": {"Data": subject}, "Body": {"Text": {"Data": body}}}
        },
    )
