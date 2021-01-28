from django.db.models import Q
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import ACLEntry
from django.conf import settings
from django.contrib.auth.hashers import check_password
from .password_recover import validate_password_recovery_token


class ACLEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = ACLEntry
        fields = "__all__"


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        exclude = ("password",)


class UserDetailSerializer(serializers.ModelSerializer):
    set_password = serializers.CharField(write_only=True)
    acl = ACLEntrySerializer(source="acls", many=True, read_only=True)

    def create(self, data):
        password = data.pop("set_password")
        u = get_user_model().objects.create(**data)
        u.set_password(password)
        u.save()
        return u

    class Meta:
        model = get_user_model()
        exclude = ("password",)


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField()
    new_password = serializers.CharField()

    def validate_old_password(self, data):
        user = self.context["user"]
        if not check_password(data, user.password):
            raise serializers.ValidationError("Wrong password")
        return data


class PasswordRecoverSerializer(serializers.Serializer):
    user = serializers.CharField()

    def validate_user(self, data):
        U = get_user_model()
        qs = U.objects.filter(Q(email=data) | Q(username=data))
        if qs.exists():
            return qs.first()
        raise serializers.ValidationError("No such user")


class PasswordResetSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField()

    def validate_token(self, data):
        user, is_valid = validate_password_recovery_token(data)
        if not is_valid:
            raise serializers.ValidationError("Invalid token.")
        try:
            return get_user_model().objects.get(pk=user)
        except get_user_model().DoesNotExist:
            raise serializers.ValidationError("Invalid token.")
