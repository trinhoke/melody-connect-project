from typing import Any
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models

class CustomUser(AbstractUser):
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    groups = models.ManyToManyField(Group, related_name='customuser_groups')
    user_permissions = models.ManyToManyField(Permission, related_name='customuser_permissions')
    friends = models.ManyToManyField("self", blank=True)

    def add_friend(self, friend):
        if friend not in self.friends.all():
            self.friends.add(friend)
            return True
        return False
    
    def get_friends(self):
        return self.friends.all()
    
    def remove_friend(self, friend):
        if friend in self.friends.all():
            self.friends.remove(friend)
            return True
        return False
    
    def __str__(self):
        return self.username
