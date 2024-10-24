from django.shortcuts import render,redirect,get_object_or_404

from music.models import Artist, Song
from .models import *
from django.http import JsonResponse
from django.forms.models import model_to_dict
from django.core.paginator import Paginator,EmptyPage
from datetime import datetime
from django.db.models import Q




def format_date(date_string):
    # Phân tích chuỗi ngày giờ theo định dạng ISO 8601
    date = datetime.fromisoformat(date_string.replace("Z", "+00:00"))

    # Định dạng theo kiểu hh:mm dd/mm/yyyy
    return date.strftime("%H:%M %d/%m/%Y")


# Create your views here.
def blog(request):
    context = {
        'user': {
            'username': request.user.username if request.user.is_authenticated else 'Khách',
            'avatar': request.user.avatar.url if request.user.is_authenticated and hasattr(request.user, 'avatar') and request.user.avatar else 'https://i0.wp.com/sbcf.fr/wp-content/uploads/2018/03/sbcf-default-avatar.png?ssl=1',
            'is_authenticated': request.user.is_authenticated,
        }
    }
    return render(request,'blog/post.html',context)

def create_new_post(request):
    if request.method == 'POST':
        if request.user.is_authenticated: 
            content = request.POST.get('content')
            music_links = request.POST.getlist('music_links')
            audio_files = request.FILES.getlist('audioFiles') 
            post = Post.objects.create(
                content=content.strip(),
                author=request.user
            )
            if music_links:
                songs = Song.objects.filter(id__in=music_links) 
                post.music_links.set(songs)

            for audio_file in audio_files:
                AudioFile.objects.create(
                    post=post,
                    audio_file=audio_file
                )
            post.save()
            post_dict = {
                'id': post.id,
                'content': content.replace('\r\n', '<br>'),
                'created_at': format_date(post.created_at.isoformat()),
                'author': {
                    'username': post.author.username,
                    'avatar': post.author.avatar.url if post.author.avatar else 'https://i0.wp.com/sbcf.fr/wp-content/uploads/2018/03/sbcf-default-avatar.png?ssl=1',
                },
                'audio_files': [
                    {
                        'id': audio.id,
                        'file_url': audio.audio_file.url
                    } for audio in AudioFile.objects.filter(post=post)
                ],
                'music_links': [
                    {
                        'id': song.id,
                        'title': song.title,
                        'url':song.audio_file.url,
                        'artist': ', '.join([artist.name for artist in song.artist.all()]),
                        'cover_image': song.cover_image.url if song.cover_image else 'https://i0.wp.com/sbcf.fr/wp-content/uploads/2018/03/sbcf-default-avatar.png?ssl=1',
                    } for song in post.music_links.all()
                ],
                'comments_count': 0
            }
            return JsonResponse({'success': True, 'post': post_dict})
        else:
            return JsonResponse({'success': False, 'message': 'Please log in'})
    else:
        return JsonResponse({'success': False, 'message': 'Invalid request method'})

def get_all_post(request,id,page=1):
    if id.lower() == 'all':
        posts = Post.objects.all().order_by('-created_at')
    else:
        posts = Post.objects.filter(author__id=id).order_by('-created_at')

    # Phân trang (5 bài viết mỗi trang)
    paginator = Paginator(posts, 5)

    try:
        posts_page = paginator.page(page)
    except EmptyPage:
        return JsonResponse({'posts': []})

    # Tạo danh sách các bài viết
    posts_list = [
        {
            'id': post.id,
            'content': post.content.replace('\r\n', '<br>'),
            'created_at': post.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'author': {
                'username': post.author.username,
                'avatar': post.author.avatar.url if post.author.avatar else 'https://i0.wp.com/sbcf.fr/wp-content/uploads/2018/03/sbcf-default-avatar.png?ssl=1',
            },
            'audio_files': [
                {
                    'id': audio.id,
                    'file_url': audio.audio_file.url
                } for audio in post.audio_files.all()  # Truy vấn qua related_name
            ],
            'music_links': [
                {
                    'id': song.id,
                    'title': song.title,
                    'url':song.audio_file.url,
                    'artist': ', '.join([artist.name for artist in song.artist.all()]),
                    'cover_image': song.cover_image.url if song.cover_image else 'https://i0.wp.com/sbcf.fr/wp-content/uploads/2018/03/sbcf-default-avatar.png?ssl=1',
                } for song in post.music_links.all()
            ], 
            'comments_count': post.comments.count(),
        }
        for post in posts_page
    ]

    # Trả về JSON
    return JsonResponse({'posts': posts_list})

def get_post_by_id(request, id):
    print(id)
    try:
        post = get_object_or_404(Post, id=id)
    except Post.DoesNotExist:
        return JsonResponse({'error': 'Post not found'}, status=404)
    
    audio_files = AudioFile.objects.filter(post=post)
    audio_files_data = [
        {
            'id': audio.id,
            'file_url': audio.audio_file.url
        } for audio in audio_files
    ]
    comments_data = [
    {
        'id': comment.id,
        'content': comment.content.replace('\r\n', '<br>'),
        'created_at': format_date(comment.created_at.isoformat()),
        'author': {
            'username':comment.user.username,
            'avatar':comment.user.avatar.url if comment.user.avatar else 'https://i0.wp.com/sbcf.fr/wp-content/uploads/2018/03/sbcf-default-avatar.png?ssl=1',
        },
        'parent': comment.parent_id, 
    }
    for comment in post.comments.all()
    ]
        
    post_data = {
        'id': post.id,
        'content': post.content.replace('\r\n', '<br>'),
        'created_at': format_date(post.created_at.isoformat()),
        'author': {
            'username': post.author.username,
            'avatar': post.author.avatar.url if post.author.avatar else 'https://i0.wp.com/sbcf.fr/wp-content/uploads/2018/03/sbcf-default-avatar.png?ssl=1',
        },
        'audio_files': audio_files_data,
        'music_links': [
                {
                    'id': song.id,
                    'title': song.title,
                    'url':song.audio_file.url,
                    'artist': ', '.join([artist.name for artist in song.artist.all()]),
                    'cover_image': song.cover_image.url if song.cover_image else 'https://i0.wp.com/sbcf.fr/wp-content/uploads/2018/03/sbcf-default-avatar.png?ssl=1',
                } for song in post.music_links.all()
            ], 
        'comments':comments_data
    }
    
    return JsonResponse({'post': post_data})
def comment_post(request):
    if request.method == 'POST':
        post_id = request.POST.get('post_id')
        content = request.POST.get('content')
        parent_id = request.POST.get('parent_id')

        post = get_object_or_404(Post, id=post_id)

        comment = Comment.objects.create(
            post=post,
            user=request.user,
            content=content,
            parent_id=parent_id if parent_id else None
        )

        response_data = {
            'id': comment.id,
            'content': comment.content.replace('\r\n','<br>'),
            'created_at': format_date(comment.created_at.isoformat()),
            'author':{
                'username':comment.user.username,
                'avatar':comment.user.avatar.url if comment.user.avatar else 'https://i0.wp.com/sbcf.fr/wp-content/uploads/2018/03/sbcf-default-avatar.png?ssl=1',
            },
            'parent_id': comment.parent_id if comment.parent_id else None,
        }

        return JsonResponse({'success':True,'comment':response_data}, status=201)
def search_songs(request):
    query = request.GET.get('q', '')
    print(query)
    if query:
        songs = Song.objects.filter(
            Q(title__icontains=query) | Q(artist__name__icontains=query)
        ).distinct()
        results = [
            {
                'id': song.id,
                 'title': song.title,
                'artist': ', '.join([artist.name for artist in song.artist.all()]),
                'cover_image': song.cover_image.url if song.cover_image else 'https://i0.wp.com/sbcf.fr/wp-content/uploads/2018/03/sbcf-default-avatar.png?ssl=1',
                'audio_file': song.audio_file.url,
                'slug': song.slug,
                'plays': song.plays
            } 
            for song in songs
        ]
    else:
        results = []

    return  JsonResponse({'success':True,'data':results})


def detail_post(request,id):
    post = get_object_or_404(Post,id=id)
    return render(request,'blog/detail_post.html',{'post':post})



