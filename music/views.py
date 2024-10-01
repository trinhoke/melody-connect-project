from django.shortcuts import render
from django.views.generic import ListView, DetailView
from .models import Song, Artist, Playlist, Area, Topic
from django.urls import path
from django.db.models import F, Q
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.contrib.auth.decorators import login_required

# Create your views here.
def home(request):
    topics_featured = Topic.objects.filter(featured=True)
    songs_featured = Song.objects.filter(featured=True)
    playlists_featured = Playlist.objects.filter(featured=True)
    artists_featured = Artist.objects.filter(featured=True)
    songs_new = Song.objects.order_by('-created_at')[:5]
    songs_top100 = Song.objects.order_by('-plays')[:6]
    return render(request, 'music/home.html', {
        'topics_featured': topics_featured,
        'songs_featured': songs_featured,
        'playlists_featured': playlists_featured,
        'artists_featured': artists_featured,
        'songs_new': songs_new,
        'songs_top100': songs_top100
    })

class SongListView(ListView):
    model = Song
    template_name = 'music/song_list.html'
    context_object_name = 'songs'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        context = {
            'songs': Song.objects.all(),
            'areas': Area.objects.all(),
            'top_songs': Song.objects.order_by('-likes')[:5],
        }
        
        return context
    
class SongDetailView(DetailView):
    model = Song
    template_name = 'music/song_detail.html'
    context_object_name = 'song'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['song'] = Song.objects.get(slug=self.kwargs['slug'])
        return context

class ArtistListView(ListView):
    model = Artist
    template_name = 'music/artist_list.html'
    context_object_name = 'artists'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['artists'] = Artist.objects.all()
        return context
    
class ArtistDetailView(DetailView):
    model = Artist
    template_name = 'music/artist_detail.html'
    context_object_name = 'artist'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        artist = Artist.objects.get(slug=self.kwargs['slug'])
        context['artist'] = artist
        context['featured_songs'] = Song.objects.filter(artist=artist).order_by('-plays')[:5]
        context['songs'] = Song.objects.filter(artist=artist).order_by('created_at')
        return context
    
class PlaylistListView(ListView):
    model = Playlist
    template_name = 'music/playlist_list.html'
    context_object_name = 'playlists'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['playlists'] = Playlist.objects.all()
        return context
    
class PlaylistDetailView(DetailView):
    model = Playlist
    template_name = 'music/playlist_detail.html'
    context_object_name = 'playlist'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['playlist'] = Playlist.objects.get(slug=self.kwargs['slug'])
        return context

def topic_detail(request, slug):
    topic = get_object_or_404(Topic, slug=slug)
    songs = Song.objects.filter(topic=topic)
    areas = Area.objects.all()
    top_songs = Song.objects.order_by('likes')[:5]
    context = {
        'topic': topic,
        'songs': songs,
        'areas': areas,
        'current_topic': topic,  
        'top_songs': top_songs,
    }
    return render(request, 'music/song_list.html', context)

@require_POST
def increment_play_count(request, slug):
    song = get_object_or_404(Song, slug=slug)
    play_duration = request.POST.get('play_duration', 0)
    
    if int(play_duration) >= song.min_play_duration:
        song.plays += 1
        song.save()
    
    return JsonResponse({'plays': song.plays})

@require_POST
@login_required
def like_song(request, slug):
    song = get_object_or_404(Song, slug=slug)
    if song.likes.filter(id=request.user.id).exists():
        song.likes.remove(request.user)
        is_liked = False
    else:
        song.likes.add(request.user)
        is_liked = True
    return JsonResponse({'likes_count': song.total_likes(), 'is_liked': is_liked})

@require_POST
@login_required
def like_playlist(request, slug):
    playlist = get_object_or_404(Playlist, slug=slug)
    if playlist.likes.filter(id=request.user.id).exists():
        playlist.likes.remove(request.user)
        is_liked = False
    else:
        playlist.likes.add(request.user)
        is_liked = True
    return JsonResponse({'likes_count': playlist.total_likes(), 'is_liked': is_liked})


@require_POST
@login_required
def toggle_follow(request, slug):
    artist = get_object_or_404(Artist, slug=slug)
    user = request.user
    is_following = False

    if user in artist.followers.all():
        artist.followers.remove(user)
    else:
        artist.followers.add(user)
        is_following = True

    return JsonResponse({
        'is_following': is_following,
        'follower_count': artist.follower_count()
    })


def search(request):
    query = request.GET.get('q')
    if query:
        songs = Song.objects.filter(Q(title__icontains=query) | Q(artist__name__icontains=query))
        artists = Artist.objects.filter(name__icontains=query)
        playlists = Playlist.objects.filter(name__icontains=query)
    else:
        songs = []
        artists = []
        playlists = []
    
    context = {
        'query': query,
        'songs': songs,
        'artists': artists,
        'playlists': playlists,
    }
    return render(request, 'music/search_results.html', context)