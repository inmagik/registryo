import uuid
from datetime import datetime, timedelta
import jwt
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template import loader


def emit_password_recovery_token(user):
    now = datetime.now()
    return jwt.encode(
        {
            "iss": settings.JWT_SERVER_FQDN,
            "sub": user.id,
            "exp": int((datetime.now() + timedelta(seconds=3600)).timestamp()),
            "iat": int(now.timestamp()),
            "nbf": int(now.timestamp()),
            "jti": str(uuid.uuid4()),
            "usage": "reset_password",
        },
        settings.SECRET_KEY,
        algorithm="HS256",
    )

def validate_password_recovery_token(token):
    try:
        claimset = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        if claimset.get("usage", "unknown") != "reset_password":
            return (None, False)
        return (claimset.get("sub"), True)
    except jwt.DecodeError:
        return (None, False)

    
def send_password_reset_email(user):
    to = user.email

    token = emit_password_recovery_token(user)

    template_text = loader.get_template('main/reset_password.txt')
    template_html = loader.get_template('main/reset_password.html')
    context = {
        'token': token,
        'user': user,
    }

    message_text = template_text.render(context)
    message_html = template_html.render(context)

    mail = EmailMultiAlternatives(
        subject="Ripristino password Web Registry",
        body=message_text,
        from_email=settings.FROM_EMAIL,
        to=[to]
    )

    mail.attach_alternative(message_html, "text/html")

    mail.send()
