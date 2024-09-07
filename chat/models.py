from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


# Create your models here.
class Room(models.Model):
    name = models.CharField(max_length=100, unique=True)
    user1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='rooms_as_user1', default=1)  # Cung cấp giá trị mặc định
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='rooms_as_user2', default=1)  # Cung cấp giá trị mặc định
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self):
        return self.name

class Message(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    room = models.ForeignKey(Room, related_name='messages', on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.user.username}: {self.content[:50]}'
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.room.updated_at = timezone.now() 
        self.room.save()