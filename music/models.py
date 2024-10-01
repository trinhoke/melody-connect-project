from django.db import models
from django.conf import settings
from django.urls import reverse
from django.utils.text import slugify
from django.contrib.auth.models import User
from cloudinary_storage.storage import RawMediaCloudinaryStorage, VideoMediaCloudinaryStorage, MediaCloudinaryStorage
from django.contrib.auth import get_user_model
import json

# Create your models here.

class Topic(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True, blank=True)
    featured = models.BooleanField(default=False)
    cover_image = models.ImageField(
        upload_to='topics/',
        blank=True,
        null=True,
        storage=MediaCloudinaryStorage()
    )

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return str(self.name)
    
class Artist(models.Model):
    name = models.CharField(max_length=200)
    bio = models.TextField(blank=True)
    genre = models.CharField(max_length=100, blank=True)
    followers = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='followed_artists',
        blank=True
    )
    nationality = models.CharField(max_length=100, blank=True)
    image = models.ImageField(
        upload_to='artists/',
        blank=True,
        null=True,
        storage=MediaCloudinaryStorage()
    )
    slug = models.SlugField(unique=True, blank=True)
    featured = models.BooleanField(default=False)
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    def follower_count(self):
        return self.followers.count()

class Song(models.Model):
    title = models.CharField(max_length=200)
    artist = models.ManyToManyField(Artist, related_name='songs')
    audio_file = models.FileField(
        upload_to='songs/',
        storage=RawMediaCloudinaryStorage()
    )
    cover_image = models.ImageField(
        upload_to='covers/',
        blank=True,
        null=True,
        storage=MediaCloudinaryStorage()
    )
    topic = models.ForeignKey(Topic, on_delete=models.SET_NULL, null=True, related_name='songs')
    lyrics = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    likes = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='liked_songs', blank=True)
    slug = models.SlugField(unique=True, blank=True)
    plays = models.PositiveIntegerField(default=0)
    min_play_duration = models.PositiveIntegerField(default=30)  # Thời gian tối thiểu (giây) để tính một lượt nghe
    featured = models.BooleanField(default=False)
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
            # Đảm bảo slug là duy nhất
            counter = 1
            original_slug = self.slug   
            while Song.objects.filter(slug=self.slug).exists():
                self.slug = f"{original_slug}-{counter}"
                counter += 1
        super().save(*args, **kwargs)
    def get_absolute_url(self):
        return reverse('song_detail', kwargs={'slug': self.slug})

    def __str__(self):
        return f"{self.title} - {', '.join(str(artist) for artist in self.artist.all())}"

    def total_likes(self):
        return self.likes.count()

class Playlist(models.Model):
    name = models.CharField(max_length=200)
    songs = models.ManyToManyField(Song, related_name='playlists')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    slug = models.SlugField(unique=True, blank=True)
    likes = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='liked_playlists', blank=True)
    cover_image = models.ImageField(
        upload_to='playlists/',
        blank=True,
        null=True,
        storage=MediaCloudinaryStorage()
    )
    featured = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name}"

    def total_likes(self):
        return self.likes.count()
    
class Area(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True)
    songs = models.ManyToManyField(Song, related_name='areas', blank=True)
    playlists = models.ManyToManyField(Playlist, related_name='areas', blank=True)
    artists = models.ManyToManyField(Artist, related_name='areas', blank=True)
    topics = models.ManyToManyField(Topic, related_name='areas', blank=True)


    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name
