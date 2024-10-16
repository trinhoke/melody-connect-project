from typing import Any
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from django.core.files.base import ContentFile
import requests

class CustomUser(AbstractUser):
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    groups = models.ManyToManyField(Group, related_name='customuser_groups')
    user_permissions = models.ManyToManyField(Permission, related_name='customuser_permissions')
    friends = models.ManyToManyField("self", blank=True, symmetrical=True)
    interests = models.TextField(null=True, blank=True)

    def add_friend(self, friend):
        if not self.is_friend(friend):
            self.friends.add(friend)
            friend.friends.add(self)
            return True
        return False
    
    def get_friends(self):
        return self.friends.all()
    
    def remove_friend(self, friend):
        if self.is_friend(friend):
            self.friends.remove(friend)
            friend.friends.remove(self)
            return True
        return False
    
    def is_friend(self, user):
        return self.friends.filter(id=user.id).exists()
    
    def __str__(self):
        return self.username

    def save(self, *args, **kwargs):
        if not self.avatar:
            try:
                url = "https://images.squarespace-cdn.com/content/v1/54b7b93ce4b0a3e130d5d232/1519987020970-8IQ7F6Z61LLBCX85A65S/icon.png?format=1000w"
                response = requests.get(url)
                if response.status_code == 200:
                    filename = "default_avatar.png"
                    self.avatar.save(filename, ContentFile(response.content), save=False)
            except Exception as e:
                print(f"Không thể tải avatar mặc định: {e}")
        super().save(*args, **kwargs)
