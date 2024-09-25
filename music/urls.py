from django.urls import path
from . import views as music_views

urlpatterns = [
    path('', music_views.home, name='home'),  # Thêm dòng này
    path('songs/', music_views.SongListView.as_view(), name='song_list'),
    path('songs/<slug:slug>/', music_views.SongDetailView.as_view(), name='song-detail'),
    
]