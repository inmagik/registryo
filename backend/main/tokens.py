import uuid
from datetime import datetime, timedelta

import jwt
from django.conf import settings

from main.crypto import get_kid, get_private_key
from main.scope import assert_scope


def emit_registry_token(scopes, user, skip_check=False):
    private_key = get_private_key()

    access_list = []

    for scope in scopes:
        if skip_check:
            actions = scope["actions"]
        else:
            actions = assert_scope(scope, user)
        access_list.append(
            {
                "type": scope["type"],
                "name": scope["name"],
                "actions": actions,
            }
        )

    now = datetime.now()
    return jwt.encode(
        {
            "iss": settings.JWT_SERVER_FQDN,
            "sub": user.username,
            "aud": settings.JWT_REGISTRY_NAME,
            "exp": int((datetime.now() + timedelta(seconds=3600 * 2)).timestamp()),
            "iat": int(now.timestamp()),
            "nbf": int((now - timedelta(seconds=60)).timestamp()),
            "jti": str(uuid.uuid4()),
            "access": access_list,
        },
        private_key,
        algorithm="RS256",
        headers={"kid": get_kid()},
    )


def emit_refresh_token(user):
    private_key = get_private_key()

    now = datetime.now()
    exp = int((datetime.now() + timedelta(days=365)).timestamp())
    return (
        jwt.encode(
            {
                "iss": settings.JWT_SERVER_FQDN,
                "sub": user.username,
                "aud": settings.JWT_REGISTRY_NAME,
                "exp": exp,
                "iat": int(now.timestamp()),
                "nbf": int(now.timestamp()),
                "jti": str(uuid.uuid4()),
                "user": user.id,
                "usage": "refresh_token",
            },
            private_key,
            algorithm="RS256",
            headers={"kid": get_kid()},
        ),
        exp,
    )
