from django.contrib import admin

from .models import Song, Topic, Playlist

# Register your models here.
admin.site.register(Topic)
admin.site.register(Song)   
admin.site.register(Playlist)