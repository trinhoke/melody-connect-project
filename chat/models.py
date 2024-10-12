from django.db import models
from django.utils import timezone
from user.models import CustomUser
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey

class RoomGroup(models.Model):
    type_room = models.CharField(max_length=10, default='group', blank=True, null=True)
    name = models.CharField(max_length=100, unique=True)
    users = models.ManyToManyField(CustomUser, related_name='rooms', blank=True)
    avatar = models.FileField(upload_to='images/',blank=True,null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    isDeleted = models.BooleanField(default= False)

    def __str__(self):
        return self.name

class RoomFriend(models.Model):
    type_room = models.CharField(max_length=10, default='friend', blank=True, null=True)
    user1 = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='rooms_as_user1', default=1) 
    user2 = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='rooms_as_user2', default=2) 
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    isDeleted = models.BooleanField(default= False)

    def __str__(self):
        return self.user1.username + " & " + self.user2.username

class NotifyFriend(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('refused', 'Refused'),
        ('canceled', 'Canceled'),
    ]
    sender = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='sender', default=1) 
    receiver = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='receiver', default=1) 
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

def get_default_content_type():
    return ContentType.objects.get_for_model(RoomGroup).id 

class Message(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, default=1)
    object_id = models.PositiveIntegerField(null=True)
    room_object = GenericForeignKey('content_type', 'object_id')
    
    audioFile = models.FileField(upload_to='audio_files/', default='default-audio.mp3')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.user.username}: {self.content[:50]}'
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

        room = self.room_object
        if isinstance(room, RoomGroup) or isinstance(room, RoomFriend):
            room.updated_at = timezone.now()
            room.save()
