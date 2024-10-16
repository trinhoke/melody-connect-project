from django.urls import path
from . import views as music_views

urlpatterns = [
    path('', music_views.home, name='home'),

    path('search/', music_views.search, name='search'),

    path('songs/', music_views.SongListView.as_view(), name='song_list'),
    
    path('songs/<slug:slug>/', music_views.SongDetailView.as_view(), name='song_detail'),
    
    path('songs/<slug:slug>/play/', music_views.increment_play_count, name='increment_play_count'),
    
    path('songs/<slug:slug>/like/', music_views.like_song, name='like_song'),

    path('favorite-songs/', music_views.favorite_song, name='favorite_song'),

    path('songs/topic/<slug:slug>/', music_views.topic_detail, name='topic_detail'),
    
    path('artists/', music_views.ArtistListView.as_view(), name='artist_list'),
    
    path('artists/<slug:slug>/', music_views.ArtistDetailView.as_view(), name='artist_detail'),
    
    path('playlists/', music_views.PlaylistListView.as_view(), name='playlist_list'),
    
    path('playlists/<slug:slug>/', music_views.PlaylistDetailView.as_view(), name='playlist_detail'),

    path('playlists/<slug:slug>/like/', music_views.like_playlist, name='like_playlist'),
    
    path('artists/<slug:slug>/toggle-follow/', music_views.toggle_follow, name='toggle_follow'),
    
    path('search-by-lyrics/', music_views.search_song_by_lyrics, name='search_song_by_lyrics'),
    path('lyrics-search/', music_views.lyrics_search, name='lyrics_search'),
]
