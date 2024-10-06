from django.db import models
from user.models import CustomUser

# Create your models here.

class Post(models.Model):
    author = models.ForeignKey(CustomUser,on_delete=models.CASCADE)
    content = models.TextField()
    music_links = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.content

class AudioFile(models.Model):
    post = models.ForeignKey(Post, related_name='audio_files', on_delete=models.CASCADE)
    audio_file = models.FileField(upload_to='audio_files/')

    def __str__(self):
        return self.audio_file.name

class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='replies',default='null')

    def __str__(self):
        return f'Comment by {self.user} on {self.post}'

    class Meta:
        ordering = ['-created_at']