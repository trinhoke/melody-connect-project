from django.shortcuts import render,redirect
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.shortcuts import get_object_or_404,Http404
from django.db.models import Q

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
        users = User.objects.filter(username__icontains=query).exclude(id=request.user.id)
        results = [{'username': user.username, 'email': user.email,'id':user.id} for user in users]
    else:
        results = []

    return  JsonResponse({'success':True,'data':results})

def create_or_get_room(request, user_id):
    user = get_object_or_404(User, id=user_id)
    room_name = generate_room_name(request.user.id, user_id)
    
    try:
        room = Room.objects.get(name=room_name)
        data = {
            'errCode':0,
            'id': room.id,
            'name': room.name,
            'other_user': room.user1.username if room.user1 != request.user else room.user2.username
        }
    except Room.DoesNotExist:
        data = {
            'errCode':1,
            "id": user.id,  # Trả về ID của người dùng nếu phòng không tồn tại
            'other_user': user.username  # Trả về tên người dùng
        }
    
    return JsonResponse({'success': True, 'data': data})


def get_rooms(request):
    user = get_object_or_404(User, id=request.user.id)
    rooms  = Room.objects.filter(user1=user).order_by('-updated_at') | Room.objects.filter(user2=user).order_by('-updated_at')
    data = [
    {
        'id': room.id,
        'name': room.name,
        'other_user': room.user1.username if room.user1 != user else room.user2.username,
        'other_user_id': room.user1.id if room.user1 != request.user else room.user2.id,
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
                'audioFile':message.audioFile.url if message.audioFile else None,
                'timestamp': message.timestamp.isoformat()
            } for message in messages[:50]
        ]
        
        room_data = {
            'id': room.id,
            'name': room.name,
            'other_user': room.user1.username if room.user1 != request.user else room.user2.username,
            'other_user_id': room.user1.id if room.user1 != request.user else room.user2.id,
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
            audioFile = request.FILES.get('audioFile')
            room = request.POST.get('room')
            room = get_object_or_404(Room,name=room)

            mess = Message.objects.create(
                user=request.user,
                room=room,
                content=content,
                audioFile = audioFile,
            )

            room.updated_at = timezone.now()
            room.save()

            data = {
                'id':mess.id,
                'user':mess.user.username,
                'content':mess.content.replace('\r\n','<br>'),
                'audioFile':mess.audioFile.url if mess.audioFile else None,
                'timestamp':mess.timestamp.isoformat(),
                'room':mess.room.name,
            }
            return JsonResponse({'success': True, 'data': data})
        else:
            return JsonResponse({'success': False, 'message': 'Please log in'})
    else:
        return JsonResponse({'success': False, 'message': 'Invalid request method'})
    
def get_friend_requests(request):
    user = get_object_or_404(User, id=request.user.id)
    friend_requests = NotifyFriend.objects.filter(receiver=user).exclude(status='canceled').order_by('-created_at')
    data = [
        {
            'sender':{
                'id':friend_request.sender.id,
                'name':friend_request.sender.username,
            },
            'status':friend_request.status
        }
    for friend_request in friend_requests
    ]

    return JsonResponse({'success':True, 'data':data})

def send_friend_request_logic(sender, receiver):
    if sender == receiver:
        return "Sender and receiver cannot be the same user."

    friend_request, created = NotifyFriend.objects.get_or_create(
        sender=sender,
        receiver=receiver,
        defaults={'status': 'pending'}
    )
    if created:
        return f"Friend request sent from {sender.username} to {receiver.username}."
    else:
        return f"Friend request already exists between {sender.username} and {receiver.username}."

def send_friend_request(request, receiver_id):
    sender = request.user  
    try:
        receiver = User.objects.get(id=receiver_id) 

        existing_request = NotifyFriend.objects.filter(sender=sender, receiver=receiver).first()
        
        if existing_request:
            if existing_request.status == 'pending':
                return JsonResponse({'message': 'Friend request already sent.'})
            else:
                existing_request.status = 'pending'
                existing_request.save()
                return JsonResponse({'message': 'Friend request resent.'})

        message = send_friend_request_logic(sender, receiver)
        return JsonResponse({'message': message})
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found.'}, status=404)

def accept_friend_request(request, sender_id):
    receiver = request.user 
    try:
        sender = User.objects.get(id=sender_id)  
        friend_request = NotifyFriend.objects.filter(sender=sender, receiver=receiver, status='pending').first()
        room_name = generate_room_name(request.user.id, sender_id)
        if friend_request:
            if sender != receiver:
                Friend.objects.create(
                user1=sender,
                user2=receiver,
                )
            friend_request.status = 'accepted'
            friend_request.save()
            room = Room.objects.create(
                name=room_name,
                user1=sender,
                user2=receiver,
            )
            return JsonResponse({'message': 'Friend request accepted.'})
        return JsonResponse({'message': 'No pending friend request found.'})
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found.'}, status=404)

def refuse_friend_request(request, sender_id):
    receiver = request.user 
    try:
        sender = User.objects.get(id=sender_id) 
        friend_request = NotifyFriend.objects.filter(sender=sender, receiver=receiver, status='pending').first()
        if friend_request:
            friend_request.status = 'refused'
            friend_request.save()
            return JsonResponse({'message': 'Friend request refused.'})
        return JsonResponse({'message': 'No pending friend request found.'})
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found.'}, status=404)
    
def cancel_friend_request(request, receiver_id):
    sender = request.user 
    try:
        receiver = User.objects.get(id=receiver_id) 
        friend_request = NotifyFriend.objects.filter(sender=sender, receiver=receiver, status='pending').first()
        if friend_request:
            friend_request.status = 'canceled'
            friend_request.save()
            return JsonResponse({'message': 'Friend request refused.'})
        return JsonResponse({'message': 'No pending friend request found.'})
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found.'}, status=404)

# def delete_friend_request(request, user_id):
#     user1 = request.user 
#     try:
#         user2 = User.objects.get(id=user_id)  

#         friend_request = Friend.objects.filter(
#             Q(sender=user1, receiver=user2) | Q(sender=user2, receiver=user1)
#         ).first()

#         if friend_request:
#             friend_request.delete()
#             return JsonResponse({'message': 'delete friend success'})
        
#         return JsonResponse({'message': 'No friend request found.'})

#     except User.DoesNotExist:
#         return JsonResponse({'error': 'User not found.'}, status=404)

def delete_friend_request(request, user_id):
    user1 = request.user
    try:
        user2 = User.objects.get(id=user_id)
        friend = Friend.objects.filter(
            Q(user1=user1, user2=user2) | Q(user1=user2, user2=user1)
        )

        if friend.exists():
            friend.delete()
            # friend_request = NotifyFriend.objects.filter( sender=user1, receiver=user2).first()
            # friend_request.status = 'canceled'
            # friend_request.save()
            return JsonResponse({'message': 'Friend deleted successfully'})
        
        return JsonResponse({'message': 'No friend request found.'})

    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found.'}, status=404)

def check_friend_request_status(request, receiver_id):
    try:
        user1 = request.user  
        user2 = User.objects.get(id=receiver_id) 
        friend = Friend.objects.filter(
                Q(user1=user1, user2=user2) | Q(user1=user2, user2=user1)
            )
        if friend.exists():
            return JsonResponse({'isFriend':True})
        else:
            friend_request_sender = NotifyFriend.objects.filter( sender=user1, receiver=user2).first()
            friend_request_receiver = NotifyFriend.objects.filter( sender=user2, receiver=user1).first()
            if friend_request_sender:
                return JsonResponse({'message':friend_request_sender.status,'errCode':0})
            elif friend_request_receiver:
                return JsonResponse({'message':friend_request_receiver.status,'errCode':1})
            
            return JsonResponse({'message': 'No friend request found.'})

    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found.'}, status=404)
