from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


# Create your models here.
class Room(models.Model):
    name = models.CharField(max_length=100, unique=True)
    user1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='rooms_as_user1', default=1) 
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='rooms_as_user2', default=1) 
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self):
        return self.name
    
class Friend(models.Model):
    user1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user1', default=1) 
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user2', default=1) 
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user1.username} - {self.user2.username} "
    

class NotifyFriend(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('refused', 'Refused'),
        ('canceled', 'Canceled'),
    ]
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sender', default=1) 
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='receiver', default=1) 
    status = models.CharField(
        max_length=10, 
        choices=STATUS_CHOICES, 
        default='pending',  
        blank=True, 
        null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.sender.username} - {self.receiver.username} ({self.status})"

class Message(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    room = models.ForeignKey(Room, related_name='messages', on_delete=models.CASCADE)
    audioFile = models.FileField(upload_to='audio_files/',default='default-audio.mp3')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.user.username}: {self.content[:50]}'
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.room.updated_at = timezone.now() 
        self.room.save()