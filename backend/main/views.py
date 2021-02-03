from django.db.models import query
from django.http import response
from main.scope import assert_scope, parse_scopes
from main.crypto import get_private_key, get_kid
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.pagination import PageNumberPagination
import jwt
from django.conf import settings
from datetime import datetime, timedelta
import uuid
import requests
import json
import re

from django.contrib.auth import get_user_model
from .serializers import (
    UserSerializer,
    ACLEntrySerializer,
    UserDetailSerializer,
    ChangePasswordSerializer,
    PasswordRecoverSerializer,
    PasswordResetSerializer,
)
from .models import ACLEntry
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.authtoken.models import Token
from .password_recover import send_password_reset_email

User = get_user_model()


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
            "exp": int(
                (datetime.now() + timedelta(seconds=3600 * 2)).timestamp()
            ),
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
    return jwt.encode(
        {
            "iss": settings.JWT_SERVER_FQDN,
            "sub": user.username,
            "aud": settings.JWT_REGISTRY_NAME,
            "exp": int((datetime.now() + timedelta(seconds=3600)).timestamp()),
            "iat": int(now.timestamp()),
            "nbf": int(now.timestamp()),
            "jti": str(uuid.uuid4()),
            "user": user.id,
            "usage": "refresh_token",
        },
        private_key,
        algorithm="RS256",
        headers={"kid": get_kid()},
    )


class MeView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, *args, **kwargs):
        return Response(
            status=200, data=UserDetailSerializer(instance=request.user).data
        )


class ChangePasswordView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        user = request.user
        ser = ChangePasswordSerializer(
            data=request.data, context={"request": request, "user": user}
        )
        ser.is_valid(raise_exception=True)

        user.set_password(ser.validated_data["new_password"])
        user.save()

        return Response(status=204)


class PasswordRecoverView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        ser = PasswordRecoverSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        user = ser.validated_data["user"]

        send_password_reset_email(user)

        return Response(status=204)


class PasswordResetView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        ser = PasswordResetSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        user = ser.validated_data["token"]
        user.set_password(ser.validated_data["new_password"])
        user.save()

        return Response(status=204)


class UserViewset(ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserDetailSerializer
    pagination_class = PageNumberPagination
    permission_classes = (IsAdminUser,)

    def get_serializer_class(self):
        if self.action == "list":
            return UserSerializer
        else:
            return self.serializer_class


class ACLEntryViewset(ModelViewSet):
    queryset = ACLEntry.objects.all()
    serializer_class = ACLEntrySerializer
    pagination_class = PageNumberPagination
    permission_classes = (IsAdminUser,)
    filter_backends = (DjangoFilterBackend,)
    filterset_fields = ("user",)


class GetTokenView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, *args, **kwargs):
        response_data = {}
        if "scope" in request.query_params:
            scopes = parse_scopes(request.query_params["scope"])
            response_data["token"] = emit_registry_token(scopes, request.user)
        if (
            "offline_token" in request.query_params
            and request.query_params.get("offline_token") == "true"
        ):
            response_data["token"] = emit_refresh_token(request.user)
            response_data["refresh_token"] = emit_refresh_token(request.user)

        return Response(
            status=200,
            data=response_data,
        )

    def post(self, request, *args, **kwargs):
        response_data = {}

        scopes = parse_scopes(request.data["scope"])
        response_data["access_token"] = emit_registry_token(
            scopes, request.user
        )

        return Response(
            status=200,
            data=response_data,
        )


# Proxy the registry API to avoid cors issues and apply user rights
class CatalogView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, *args, **kwargs):
        url = f"{settings.JWT_REGISTRY_URL}/_catalog"
        token = emit_registry_token(
            [{"type": "registry", "name": "catalog", "actions": ["*"]}],
            request.user,
            skip_check=True,
        )
        response = requests.get(
            url, headers={"Authorization": f"Bearer {token}"}
        )
        repositories = response.json()["repositories"]
        visible_repositories = []
        for repo in repositories:
            if request.user.is_staff:
                access_right = ["pull"]
            else:
                access_right = assert_scope(
                    {"type": "repository", "name": repo, "actions": ["pull"]},
                    request.user,
                )
            if "pull" in access_right:
                visible_repositories.append(repo)
        return Response(
            status=response.status_code,
            data={"repositories": visible_repositories},
        )


class TagsView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, repo_name=None, *args, **kwargs):
        url = f"{settings.JWT_REGISTRY_URL}/{repo_name}/tags/list"
        token = emit_registry_token(
            [{"type": "repository", "name": repo_name, "actions": ["pull"]}],
            request.user,
            skip_check=request.user.is_staff
        )
        response = requests.get(
            url, headers={"Authorization": f"Bearer {token}"}
        )
        return Response(status=response.status_code, data=response.json())


class ManifestView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, repo_name=None, ref_name=None, *args, **kwargs):
        url = f"{settings.JWT_REGISTRY_URL}/{repo_name}/manifests/{ref_name}"
        token_v1 = emit_registry_token(
            [{"type": "repository", "name": repo_name, "actions": ["pull"]}],
            request.user,
            skip_check=request.user.is_staff
        )
        token_v2 = emit_registry_token(
            [{"type": "repository", "name": repo_name, "actions": ["pull"]}],
            request.user,
            skip_check=request.user.is_staff
        )
        response_v1 = requests.get(
            url,
            headers={
                "Authorization": f"Bearer {token_v1}",
                "Accept": "application/vnd.docker.distribution.manifest.v1+json",
            },
        )
        response_v2 = requests.get(
            url,
            headers={
                "Authorization": f"Bearer {token_v2}",
                "Accept": "application/vnd.docker.distribution.manifest.v2+json",
            },
        )
        if response_v1.status_code < 400 and response_v2.status_code < 400:
            manifest_v1 = response_v1.json()
            manifest_v2 = response_v2.json()
            layers = []
            ws_regex = re.compile(r"\s+")
            sizes = {
                item["digest"]: item["size"] for item in manifest_v2["layers"]
            }
            hist = manifest_v1["history"]
            for i, layer_info in enumerate(hist):
                legacy_data = json.loads(
                    layer_info["v1Compatibility"]
                )
                digest = manifest_v1["fsLayers"][i]["blobSum"]
                layer_data = {
                    "size": int(sizes.get(digest, 0)),
                    "digest": digest,
                    "command": ws_regex.sub(
                        " ", " ".join(legacy_data["container_config"]["Cmd"])
                    ),
                    "ports": legacy_data["container_config"].get(
                        "ExposedPorts", {}
                    ),
                    "created": legacy_data["created"],
                }
                layers.append(layer_data)
            layers.reverse()
            return Response(
                status=200,
                data={
                    **manifest_v2,
                    "layers": layers,
                    "size": sum([item["size"] for item in layers]),
                    "created": max([item["created"] for item in layers]),
                    "v2": manifest_v2,
                    "v1": manifest_v1
                },
            )
        else:
            return Response(status=404, data={})