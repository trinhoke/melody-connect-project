from django.shortcuts import render,redirect,get_object_or_404
from .models import *
from django.http import JsonResponse
from django.forms.models import model_to_dict
from django.core.paginator import Paginator,EmptyPage
from datetime import datetime



def format_date(date_string):
    # Phân tích chuỗi ngày giờ theo định dạng ISO 8601
    date = datetime.fromisoformat(date_string.replace("Z", "+00:00"))

    # Định dạng theo kiểu hh:mm dd/mm/yyyy
    return date.strftime("%H:%M %d/%m/%Y")


# Create your views here.
def blog(request):
    context = {
        'user': request.user
    }
    return render(request,'blog/post.html',context)

def create_new_post(request):
    if request.method == 'POST':
        if request.user.is_authenticated: 
            content = request.POST.get('content')
            music_links = request.POST.get('music_link', None)
            audio_files = request.FILES.getlist('audioFiles') 
            post = Post.objects.create(
                content=content.strip(),
                music_links=music_links,
                author=request.user
            )
            for audio_file in audio_files:
                AudioFile.objects.create(
                    post=post,
                    audio_file=audio_file
                )
            post_dict = {
                'id': post.id,
                'content': content.replace('\r\n', '<br>'),
                'created_at': format_date(post.created_at.isoformat()),
                'author': post.author.username,
                'audio_files': [
                    {
                        'id': audio.id,
                        'file_url': audio.audio_file.url
                    } for audio in AudioFile.objects.filter(post=post)
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
    
    paginator = Paginator(posts, 5)

    try:
        posts_page = paginator.page(page)
    except EmptyPage:
        return JsonResponse({'posts': []})

    posts_list = [
        {
            'id': post.id,
            'content':post.content.replace('\r\n', '<br>'),
            'created_at': format_date(post.created_at.isoformat()),
            'author': post.author.username,
            'audio_files': [
                {
                    'id': audio.id,
                    'file_url': audio.audio_file.url
                } for audio in AudioFile.objects.filter(post=post)
            ],
            'comments_count': post.comments.count()  
        }
        for post in posts_page
    ]
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
        'author': comment.user.username,
        'parent': comment.parent_id, 
    }
    for comment in post.comments.all()
    ]
        
    post_data = {
        'id': post.id,
        'content': post.content.replace('\r\n', '<br>'),
        'created_at': format_date(post.created_at.isoformat()),
        'author': post.author.username,
        'audio_files': audio_files_data,
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
            'author': comment.user.username,
            'parent_id': comment.parent_id if comment.parent_id else None,
        }

        return JsonResponse({'success':True,'comment':response_data}, status=201)

    return redirect('blog', post_id=post_id)