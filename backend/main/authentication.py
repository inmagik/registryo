from django.contrib.auth import get_user, get_user_model
from rest_framework.authentication import BaseAuthentication
from rest_framework import exceptions
from rest_framework import HTTP_HEADER_ENCODING, exceptions
from django.utils.translation import gettext_lazy as _
from base64 import b64decode
import binascii
from django.contrib.auth.hashers import check_password
import jwt
from .crypto import get_public_key
from django.conf import settings


def get_authorization_header(request):
    """
    Return request's 'Authorization:' header, as a bytestring.
    Hide some test client ickyness where the header can be unicode.
    """
    auth = request.META.get("HTTP_AUTHORIZATION", b"")
    if isinstance(auth, str):
        # Work around django test client oddness
        auth = auth.encode(HTTP_HEADER_ENCODING)
    return auth


class DockerAuthentication(BaseAuthentication):

    keyword = "Bearer"

    def authenticate(self, request):
        auth = get_authorization_header(request).split()

        if not auth or auth[0].lower() != self.keyword.lower().encode():
            return None

        if len(auth) == 1:
            msg = _("Invalid token header. No credentials provided.")
            raise exceptions.AuthenticationFailed(msg)
        elif len(auth) > 2:
            msg = _(
                "Invalid token header. Token string should not contain spaces."
            )
            raise exceptions.AuthenticationFailed(msg)

        try:
            token = auth[1].decode()
        except UnicodeError:
            msg = _(
                "Invalid token header. Token string should not contain invalid characters."
            )
            raise exceptions.AuthenticationFailed(msg)

        try:
            decoded = b64decode(token).decode()
        except binascii.Error:
            msg = _(
                "Invalid token header. Token string should be base64 encoded."
            )
            raise exceptions.AuthenticationFailed(msg)

        parts = decoded.split(":")
        if len(parts) == 1:
            msg = _("Invalid token header: invalid credentials.")
            raise exceptions.AuthenticationFailed(msg)
        if len(parts) > 2:
            msg = _("Invalid token header: invalid credentials.")
            raise exceptions.AuthenticationFailed(msg)

        username, password = parts

        return self.authenticate_credentials(username, password)

    def authenticate_credentials(self, username, password):
        try:
            u = get_user_model().objects.get(username=username)
        except get_user_model().DoesNotExist:
            msg = _("Invalid token.")
            raise exceptions.AuthenticationFailed(msg)

        if check_password(password, u.password):
            return (
                u,
                None,
            )
        else:
            msg = _("Invalid token.")
            raise exceptions.AuthenticationFailed(msg)

    def authenticate_header(self, request):
        return self.keyword


class PayloadAuthentication(BaseAuthentication):

    def authenticate(self, request):
        if request.method != "POST":
            return None

        if "grant_type" not in request.POST or request.POST["grant_type"] != "refresh_token":
            return None

        try:
            claims = jwt.decode(
                request.POST["refresh_token"],
                get_public_key(),
                algorithms=["RS256"],
                audience=settings.JWT_REGISTRY_NAME
            )
        except Exception:
            msg = _("Invalid token")
            raise exceptions.AuthenticationFailed(msg)

        if claims.get("usage", "") != "refresh_token":
            msg = _("Invalid token.")
            raise exceptions.AuthenticationFailed(msg)

        return (
            get_user_model().objects.get(pk=claims["user"]),
            None,
        )

    def authenticate_header(self, request):
        return self.keyword