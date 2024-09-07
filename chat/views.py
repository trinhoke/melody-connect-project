from django.shortcuts import render,redirect
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.shortcuts import get_object_or_404,Http404

import hashlib
from .models import *


# Create your views here.

def generate_room_name(user_id1, user_id2):
    user_ids = sorted([user_id1, user_id2])
    return hashlib.md5(f"{user_ids[0]}_{user_ids[1]}".encode()).hexdigest()

def getHome(request):
    return render(request,'chat/chat.html')

def search_users(request):
    query = request.GET.get('q', '')
    if query:
        users = User.objects.filter(username__icontains=query)
        results = [{'username': user.username, 'email': user.email,'id':user.id} for user in users]
    else:
        results = []

    return  JsonResponse({'success':True,'data':results})

def create_or_get_room(request, user_id):
    user = get_object_or_404(User, id=user_id)
    room_name = generate_room_name(request.user.id, user_id)
    try:
        room = Room.objects.get(name=room_name)
    except Room.DoesNotExist:
        room = Room.objects.create(
            name=room_name,
            user1=request.user,
            user2=user,
        )

    data = {
            'id':room.id,
            'name':room.name,
            'other_user': room.user1.username if room.user1 != request.user else room.user2.username
        } 

    return JsonResponse({'success':True, 'data':data})


def get_rooms(request):
    user = get_object_or_404(User, id=request.user.id)
    rooms  = Room.objects.filter(user1=user).order_by('-updated_at') | Room.objects.filter(user2=user).order_by('-updated_at')
    data = [
    {
        'id': room.id,
        'name': room.name,
        'other_user': room.user1.username if room.user1 != user else room.user2.username,
        'mess': [
            {
                'id': mess.id,
                'user': mess.user.username,
                'content': mess.content.replace('\r\n', '<br>'),
                'timestamp': mess.timestamp.isoformat()
            }
            for mess in Message.objects.filter(room=room).order_by("-timestamp")[:1]
        ]
    }
    for room in rooms
]
    return JsonResponse({'success':True, 'data':data})

def get_room(request, name_room):
    try:
        room = Room.objects.get(name=name_room)
        if request.user not in [room.user1, room.user2]:
            return JsonResponse({"success": False, "message": "Unauthorized"}, status=403)

        messages = Message.objects.filter(room=room).order_by('timestamp')

        messages_data = [
            {
                'id': message.id,
                'user': message.user.username,
                'content': message.content.replace('\r\n','<br>'),
                'timestamp': message.timestamp.isoformat()
            } for message in messages[:50]
        ]
        
        room_data = {
            'id': room.id,
            'name': room.name,
            'other_user': room.user1.username if room.user1 != request.user else room.user2.username,
            'description': room.description,
            'created_at': room.created_at.isoformat(),
            'updated_at': room.updated_at.isoformat()
        }

        return JsonResponse({"success": True, "room": room_data, "messages": messages_data})

    except Room.DoesNotExist:
        raise Http404("Room does not exist")

def sender_message(request):
    if request.method == 'POST':
        if request.user.is_authenticated: 
            content = request.POST.get('content')
            room = request.POST.get('room')
            room = get_object_or_404(Room,name=room)

            mess = Message.objects.create(
                user=request.user,
                room=room,
                content=content,
            )

            room.updated_at = timezone.now()
            room.save()

            data = {
                'id':mess.id,
                'user':mess.user.username,
                'content':mess.content.replace('\r\n','<br>'),
                'timestamp':mess.timestamp.isoformat(),
                'room':mess.room.name,
            }
            return JsonResponse({'success': True, 'data': data})
        else:
            return JsonResponse({'success': False, 'message': 'Please log in'})
    else:
        return JsonResponse({'success': False, 'message': 'Invalid request method'})