from rest_framework import urlpatterns
from rest_framework.routers import SimpleRouter
from rest_framework.authtoken.views import obtain_auth_token
from django.urls import path
from .views import (
    GetTokenView,
    MeView,
    ChangePasswordView,
    PasswordRecoverView,
    PasswordResetView,
    UserViewset,
    ACLEntryViewset,
    CatalogView,
    TagsView,
    ManifestView,
)

router = SimpleRouter()

router.register("user", UserViewset)
router.register("aclentry", ACLEntryViewset)

urlpatterns = router.urls + [
    path("auth/", GetTokenView.as_view()),
    path("login/", obtain_auth_token),
    path("me/", MeView.as_view()),
    path("me/change-password/", ChangePasswordView.as_view()),
    path("me/recover-password/", PasswordRecoverView.as_view()),
    path("me/reset-password/", PasswordResetView.as_view()),
    path("registry/catalog/", CatalogView.as_view()),
    path("registry/<path:repo_name>/tags/list/", TagsView.as_view()),
    path("registry/<path:repo_name>/manifests/<ref_name>/", ManifestView.as_view()),
]