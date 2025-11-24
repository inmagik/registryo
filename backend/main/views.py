from main.scope import assert_scope, parse_scopes, find_acl
from main.tokens import emit_registry_token, emit_refresh_token
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.conf import settings

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
    RepositoryACLSerializer,
)
from .models import ACLEntry
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.authtoken.models import Token
from .password_recover import send_password_reset_email

User = get_user_model()


class MeView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, *args, **kwargs):
        return Response(status=200, data=UserDetailSerializer(instance=request.user).data)


class ChangePasswordView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        user = request.user
        ser = ChangePasswordSerializer(data=request.data, context={"request": request, "user": user})
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
        if "offline_token" in request.query_params and request.query_params.get("offline_token") == "true":
            token, expires = emit_refresh_token(request.user)
            response_data["token"] = token
            response_data["refresh_token"] = token

        return Response(
            status=200,
            data=response_data,
        )

    def post(self, request, *args, **kwargs):
        response_data = {}

        scopes = parse_scopes(request.data["scope"])
        response_data["access_token"] = emit_registry_token(scopes, request.user)

        return Response(
            status=200,
            data=response_data,
        )


# Proxy the registry API to avoid cors issues and apply user rights
class CatalogView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, *args, **kwargs):
        url = f"{settings.JWT_REGISTRY_URL}/v2/_catalog"
        token = emit_registry_token(
            [{"type": "registry", "name": "catalog", "actions": ["*"]}],
            request.user,
            skip_check=True,
        )
        visible_repositories = []
        while url:
            response = requests.get(url, headers={"Authorization": f"Bearer {token}"})
            data = response.json()
            repositories = data["repositories"]
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
            try:
                url = settings.JWT_REGISTRY_URL + response.links["next"]["url"]
            except KeyError:
                url = None
        return Response(
            status=response.status_code,
            data={"repositories": visible_repositories},
        )


class TagsView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, repo_name=None, *args, **kwargs):
        url = f"{settings.JWT_REGISTRY_URL}/v2/{repo_name}/tags/list"
        token = emit_registry_token(
            [{"type": "repository", "name": repo_name, "actions": ["pull"]}],
            request.user,
            skip_check=request.user.is_staff,
        )
        response = requests.get(url, headers={"Authorization": f"Bearer {token}"})
        data = response.json()
        acl = find_acl(repo_name)
        out = {
            "name": data["name"],
            "tags": data["tags"] or [],
            "acl": RepositoryACLSerializer(instance=acl, many=True).data,
        }
        return Response(status=response.status_code, data=out)


class ManifestView(APIView):
    permission_classes = (IsAuthenticated,)

    def get_oci_manifest(self, request, repo_name, ref_name):
        url = f"{settings.JWT_REGISTRY_URL}/v2/{repo_name}/manifests/{ref_name}"
        token = emit_registry_token(
            [{"type": "repository", "name": repo_name, "actions": ["pull"]}],
            request.user,
            skip_check=request.user.is_staff,
        )
        response = requests.get(
            url,
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.oci.image.index.v1+json",
            },
        )
        if response.status_code < 400:
            oci_index = response.json()
            if oci_index["schemaVersion"] == 2:
                manifests = []
                for manifest_reference in oci_index["manifests"]:
                    try:
                        platform_os = manifest_reference["platform"]["os"]
                    except KeyError:
                        platform_os = "unknown"
                    try:
                        platform_arch = manifest_reference["platform"]["architecture"]
                    except KeyError:
                        platform_arch = "unknown"
                    platform = f"{platform_os}/{platform_arch}"
                    if platform not in ["unknown/unknown"]:
                        manifest_url = (
                            f"{settings.JWT_REGISTRY_URL}/v2/{repo_name}/manifests/{manifest_reference['digest']}"
                        )
                        manifest_response = requests.get(
                            manifest_url,
                            headers={
                                "Authorization": f"Bearer {token}",
                                "Accept": "application/vnd.oci.image.manifest.v1+json",
                            },
                        )
                        manifest_data = manifest_response.json()
                        print("OCI MANIFEST", platform, manifest_data)
                        manifests.append(
                            {
                                "digest": manifest_reference["digest"],
                                "os": platform_os,
                                "arch": platform_arch,
                                "layers": manifest_data["layers"],
                            }
                        )
                return manifests
            if oci_index["schemaVersion"] == 1:
                pass
        return None

    def get_docker_fat_manifest(self, request, repo_name, ref_name):
        url = f"{settings.JWT_REGISTRY_URL}/v2/{repo_name}/manifests/{ref_name}"
        token = emit_registry_token(
            [{"type": "repository", "name": repo_name, "actions": ["pull"]}],
            request.user,
            skip_check=request.user.is_staff,
        )
        response = requests.get(
            url,
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.docker.distribution.manifest.list.v2+json",
            },
        )
        if response.status_code < 400:
            index = response.json()
            if index["schemaVersion"] == 2:
                manifests = []
                for manifest_reference in index["manifests"]:
                    try:
                        platform_os = manifest_reference["platform"]["os"]
                    except KeyError:
                        platform_os = "unknown"
                    try:
                        platform_arch = manifest_reference["platform"]["architecture"]
                    except KeyError:
                        platform_arch = "unknown"
                    platform = f"{platform_os}/{platform_arch}"
                    if platform not in ["unknown/unknown"]:
                        manifest_url = (
                            f"{settings.JWT_REGISTRY_URL}/v2/{repo_name}/manifests/{manifest_reference['digest']}"
                        )
                        manifest_response = requests.get(
                            manifest_url,
                            headers={
                                "Authorization": f"Bearer {token}",
                                "Accept": "application/vnd.docker.distribution.manifest.v2+json",
                            },
                        )
                        manifests.append(
                            {
                                "digest": manifest_reference["digest"],
                                "os": platform_os,
                                "arch": platform_arch,
                                "layers": manifest_response.json()["layers"],
                            }
                        )
                return manifests
            if index["schemaVersion"] == 1:
                pass
        return None

    def get_docker_manifest_v2(self, request, repo_name, ref_name):
        url = f"{settings.JWT_REGISTRY_URL}/v2/{repo_name}/manifests/{ref_name}"
        token = emit_registry_token(
            [{"type": "repository", "name": repo_name, "actions": ["pull"]}],
            request.user,
            skip_check=request.user.is_staff,
        )
        response = requests.get(
            url,
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.docker.distribution.manifest.v2+json",
            },
        )
        if response.status_code < 400:
            data = response.json()
            if data["schemaVersion"] == 2:
                return [{"digest": data["config"]["digest"], "os": "*", "arch": "*", "layers": data["layers"]}]
        return None

    def get(self, request, repo_name=None, ref_name=None, *args, **kwargs):
        try:
            oci_manifests = self.get_oci_manifest(request, repo_name, ref_name)
            if oci_manifests is not None:
                return Response(status=200, data={"type": "oci", "manifests": oci_manifests})
        except Exception:
            pass
        try:
            docker_fat_manifest = self.get_docker_fat_manifest(request, repo_name, ref_name)
            if docker_fat_manifest is not None:
                return Response(status=200, data={"type": "docker-fat", "manifests": docker_fat_manifest})
        except Exception:
            pass
        try:
            docker_manifest_v2 = self.get_docker_manifest_v2(request, repo_name, ref_name)
            if docker_manifest_v2 is not None:
                return Response(status=200, data={"type": "docker-v2", "manifests": docker_manifest_v2})
        except Exception:
            pass
        return Response(status=404)

    # def get(self, request, repo_name=None, ref_name=None, *args, **kwargs):
    #     url = f"{settings.JWT_REGISTRY_URL}/v2/{repo_name}/manifests/{ref_name}"
    #     token = emit_registry_token(
    #         [{"type": "repository", "name": repo_name, "actions": ["pull"]}],
    #         request.user,
    #         skip_check=request.user.is_staff
    #     )
    #     response_v1 = requests.get(
    #         url,
    #         headers={
    #             "Authorization": f"Bearer {token}",
    #             "Accept": "application/vnd.docker.distribution.manifest.v1+json",
    #         },
    #     )
    #     response_v2 = requests.get(
    #         url,
    #         headers={
    #             "Authorization": f"Bearer {token}",
    #             "Accept": "application/vnd.docker.distribution.manifest.v2+json",
    #         },
    #     )

    #     response_oci_manifest = requests.get(
    #         url,
    #         headers={
    #             "Authorization": f"Bearer {token}",
    #             "Accept": "application/vnd.oci.image.index.v1+json",
    #         },
    #     )

    #     manifest_v1 = None
    #     manifest_v2 = None
    #     manifest_oci = None

    #     if response_v1.status_code < 400:
    #         manifest_v1 = response_v1.json()
    #     if response_v2.status_code < 400:
    #         manifest_v2 = response_v2.json()
    #     if response_oci_manifest.status_code < 400:
    #         manifest_oci = response_oci_manifest.json()

    #     print("MANIFEST V1", manifest_v1)
    #     print("MANIFEST V2", manifest_v2)
    #     print("MANIFEST OCI", manifest_oci)

    #     if manifest_v1 and manifest_v2:
    #         sizes = {
    #             item["digest"]: item["size"] for item in manifest_v2["layers"]
    #         }
    #         ws_regex = re.compile(r"\s+")
    #         layers = []
    #         for i, layer_info in enumerate(manifest_v1["history"]):
    #             legacy_data = json.loads(
    #                 layer_info["v1Compatibility"]
    #             )
    #             cfg = legacy_data.get("container_config", legacy_data.get("config", {}))
    #             digest = manifest_v1["fsLayers"][i]["blobSum"]
    #             layer_data = {
    #                 "size": int(sizes.get(digest, 0)),
    #                 "digest": digest,
    #                 "command": ws_regex.sub(
    #                     " ", " ".join(cfg.get("Cmd", []))
    #                 ),
    #                 "ports": cfg.get(
    #                     "ExposedPorts", {}
    #                 ),
    #                 "created": legacy_data["created"],
    #             }
    #             layers.append(layer_data)
    #         layers.reverse()
    #     return Response(
    #         status=200,
    #         data={
    #             **manifest_v2,
    #             "layers": layers,
    #             "size": sum([item["size"] for item in layers]),
    #             "created": max([item["created"] for item in layers]),
    #             "v2": manifest_v2,
    #             "v1": manifest_v1,
    #             "digest": response_v2.headers.get("Docker-Content-Digest")
    #         },
    #     )
    # else:
    #     return Response(status=404, data={})

    def delete(self, request, repo_name=None, ref_name=None, *args, **kwargs):
        url = f"{settings.JWT_REGISTRY_URL}/v2/{repo_name}/manifests/{ref_name}"
        token_v2 = emit_registry_token(
            [{"type": "repository", "name": repo_name, "actions": ["delete"]}],
            request.user,
            skip_check=request.user.is_staff,
        )
        response_v2 = requests.delete(
            url,
            headers={
                "Authorization": f"Bearer {token_v2}",
                "Accept": "application/vnd.docker.distribution.manifest.v2+json",
            },
        )
        print(response_v2.text)
        if response_v2.status_code < 400:
            return Response(status=202)
        else:
            return Response(status=404)


class DeleteLayerView(APIView):
    permission_classes = (IsAuthenticated,)

    def delete(self, request, repo_name=None, digest=None, *args, **kwargs):
        url = f"{settings.JWT_REGISTRY_URL}/v2/{repo_name}/blobs/{digest}"
        token = emit_registry_token(
            [{"type": "repository", "name": repo_name, "actions": ["delete"]}],
            request.user,
            skip_check=request.user.is_staff,
        )
        response = requests.delete(
            url,
            headers={
                "Authorization": f"Bearer {token}",
            },
        )
        if response.status_code < 400:
            return Response(status=202)
        else:
            return Response(status=404)
