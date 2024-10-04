from django.contrib import admin
from .models import Song, Topic, Playlist, Artist, Area

class TopicAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'featured']
    list_editable = ['featured']
    search_fields = ['name']

class SongAdmin(admin.ModelAdmin):
    list_display = ['title', 'get_artists', 'topic', 'plays', 'featured']
    list_editable = ['featured']
    list_filter = ['topic', 'featured']
    search_fields = ['title', 'artist__name']
    filter_horizontal = ['artist', 'likes']

    def get_artists(self, obj):
        return ", ".join([artist.name for artist in obj.artist.all()])
    get_artists.short_description = 'Artists'

class PlaylistAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at', 'updated_at', 'featured']
    list_editable = ['featured']
    filter_horizontal = ['songs', 'likes']
    search_fields = ['name']

class ArtistAdmin(admin.ModelAdmin):
    list_display = ['name', 'genre', 'nationality', 'featured']
    list_editable = ['featured']
    search_fields = ['name', 'genre', 'nationality']
    filter_horizontal = ['followers']

class AreaAdmin(admin.ModelAdmin):
    list_display = ['name']
    filter_horizontal = ['songs', 'playlists', 'artists', 'topics']
    search_fields = ['name']

admin.site.register(Topic, TopicAdmin)
admin.site.register(Song, SongAdmin)
admin.site.register(Playlist, PlaylistAdmin)
admin.site.register(Artist, ArtistAdmin)
admin.site.register(Area, AreaAdmin)