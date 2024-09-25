from django.shortcuts import render
from django.views.generic import ListView, DetailView
from .models import Song
from django.urls import path
from django.db.models import F
# Create your views here.
def home(request):
    return render(request, 'music/home.html')

class SongListView(ListView):
    model = Song
    template_name = 'music/song_list.html'
    context_object_name = 'songs'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # Lấy tất cả bài hát    
        context['songs'] = Song.objects.all()
        
        # Lấy top bài hát được sắp xếp theo lượt like giảm dần
        context['top_songs'] = Song.objects.order_by('-likes')[:5]
        return context
    
class SongDetailView(DetailView):
    model = Song
    template_name = 'music/song_detail.html'
    context_object_name = 'song'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['song'] = Song.objects.get(slug=self.kwargs['slug'])
        return context
