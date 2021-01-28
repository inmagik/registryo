from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class ACLEntry(models.Model):
    user = models.ForeignKey(User, models.CASCADE, related_name="acls")
    type = models.CharField(max_length=512)
    name = models.CharField(max_length=512)
    actions = models.CharField(max_length=512)

    class Meta:
        ordering = ("user", "type", )
