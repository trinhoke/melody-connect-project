from django.shortcuts import render,redirect
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.shortcuts import get_object_or_404,Http404
from django.db.models import Q
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

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
        users = CustomUser.objects.filter(username__icontains=query).exclude(id=request.user.id)
        results = [{'username': user.username,'avatar':user.avatar.url if user.avatar else 'https://i0.wp.com/sbcf.fr/wp-content/uploads/2018/03/sbcf-default-avatar.png?ssl=1', 'email': user.email,'id':user.id} for user in users]
    else:
        results = []

    return  JsonResponse({'success':True,'data':results})

def create_or_get_room(request, user_id):
    user = get_object_or_404(CustomUser, id=user_id)    
    room_name = generate_room_name(request.user.id, user_id)
    
    try:
        room = RoomGroup.objects.get(name=room_name)
        data = {
            'errCode': 0,
            'id': room.id,  
            'name': room.name, 
            'other_user': room.user1.username if room.user1 != request.user else room.user2.username
        }
    except RoomGroup.DoesNotExist:
        data = {
            'errCode': 1,
            "id": user.id, 
            'other_user': {
                'id':user.id,
                'username':user.username,
                'avatar':user.avatar.url if user.avatar else 'https://i0.wp.com/sbcf.fr/wp-content/uploads/2018/03/sbcf-default-avatar.png?ssl=1',
            } 
        }
        return JsonResponse({'success': True, 'data': data})

def get_friends(request):
    user = request.user
    if(user):
        friends = user.get_friends()
        data = [
            {
                'id':friend.id,
                'username':friend.username,
                'avatar': friend.avatar.url if friend.avatar else 'https://i0.wp.com/sbcf.fr/wp-content/uploads/2018/03/sbcf-default-avatar.png?ssl=1',
            } for friend in friends
        ]
        return JsonResponse({'success': True, 'data': data})

def sender_message(request):
    if request.method == 'POST':
        if request.user.is_authenticated: 
            content = request.POST.get('content')
            audioFile = request.FILES.get('audioFile')
            id = request.POST.get('id')  # Lấy ID của phòng chat
            type_room = request.POST.get('type_room')  # Xác định loại phòng (nhóm hay bạn bè)
            
            # Kiểm tra phòng loại "group" hoặc "friend"
            if type_room == 'group':
                room = get_object_or_404(RoomGroup, id=id)
            else:
                room = get_object_or_404(RoomFriend, id=id)

            # Tạo tin nhắn
            content_type = ContentType.objects.get_for_model(room)
            mess = Message.objects.create(
                user=request.user,
                content_type=content_type,
                object_id=room.id,
                content=content,
                audioFile=audioFile,
            )
            
            # Cập nhật thời gian mới nhất của phòng
            room.updated_at = timezone.now()
            room.save()

            # Dữ liệu tin nhắn sẽ gửi cho tất cả thành viên
            data = {
                'id': mess.id,
                'user': {
                    'id': mess.user.id,
                    'username': mess.user.username,
                    'avatar': mess.user.avatar.url if mess.user.avatar else 'https://i0.wp.com/sbcf.fr/wp-content/uploads/2018/03/sbcf-default-avatar.png?ssl=1',
                },
                'content': mess.content.replace('\r\n','<br>'),
                'audioFile': mess.audioFile.url if mess.audioFile else None,
                'timestamp': mess.timestamp.isoformat(),
                'room_id': room.id,
                'room_type': type_room,
            }

            channel_layer = get_channel_layer()
            if type_room == 'group':
                for user in room.users.all():
                    async_to_sync(channel_layer.group_send)(
                        f"user_{user.id}",
                        {
                            'type': 'new_message',
                            'message': data,  
                        }
                    )
            else:
                async_to_sync(channel_layer.group_send)(
                    f"user_{room.user1.id}",
                    {
                        'type': 'new_message',
                        'message': data,
                    }
                )
                async_to_sync(channel_layer.group_send)(
                    f"user_{room.user2.id}",
                    {
                        'type': 'new_message',
                        'message': data,
                    }
                )
            
            return JsonResponse({'success': True, 'data': data})
        else:
            return JsonResponse({'success': False, 'message': 'Please log in'})
    else:
        return JsonResponse({'success': False, 'message': 'Invalid request method'})

def create_room(request):
    if request.method == 'POST':
        if request.user.is_authenticated:
            channel_layer = get_channel_layer()
            typeRoom = request.POST.get('typeRoom')
            if typeRoom == 'group':
                name = request.POST.get('name')
                avatar = request.FILES.get('avatar', None)  
                user_ids = request.POST.getlist('userIds') 
                users = CustomUser.objects.filter(id__in=user_ids)
                room = RoomGroup.objects.create(
                    type_room="group",
                    name=name,
                    avatar=avatar if avatar else None,
                )
                room.users.set(users)
                room.users.add(request.user)
                for user in users:
                    async_to_sync(channel_layer.group_send)(
                        f"user_{user.id}",
                        {
                            'errCode':1,
                            'type': 'chat_room_created',
                            'room': room.id,
                        }
                    )
                async_to_sync(channel_layer.group_send)(
                    f"user_{request.user.id}",
                    {
                        'errCode':0,
                        'type': 'chat_room_created',
                        'room': room.id,
                    }
                )

            elif typeRoom == 'friend':
                user_id = request.POST.get('userId') 
                user = CustomUser.objects.get(id=user_id)
                existing_room = RoomFriend.objects.filter(
                    Q(user1=request.user, user2=user) |
                    Q(user1=user, user2=request.user)
                ).first()
                if existing_room:
                    room_data = {
                        'id': existing_room.id,
                        'name': user.username,
                        'avatar': user.avatar.url if user.avatar else 'https://i0.wp.com/sbcf.fr/wp-content/uploads/2018/03/sbcf-default-avatar.png?ssl=1',
                        'created_at': existing_room.created_at.isoformat(),
                        'updated_at': existing_room.updated_at.isoformat()
                    }
                    return JsonResponse({'success': True, 'room': room_data, 'message': 'RoomGroup already exists'})
                else:
                    room = RoomFriend.objects.create(
                        type_room="friend",
                        user1=request.user,
                        user2=user
                    )
                    async_to_sync(channel_layer.group_send)(
                        f"user_{request.user.id}",
                        {
                            'errCode':1,
                            'type': 'chat_room_created',
                            'room': room.id,
                        }
                    )
                    async_to_sync(channel_layer.group_send)(
                        f"user_{user.id}",
                        {
                            'errCode':0,
                            'type': 'chat_room_created',
                            'room': room.id,
                        }
                    )
            return JsonResponse({'success': True, 'message': 'Room created successfully'})
        else:
            return JsonResponse({'success': False, 'message': 'Please log in'})
    else:
        return JsonResponse({'success': False, 'message': 'Invalid request method'})

def get_rooms(request):
    if request.user.is_authenticated:
        user = request.user
        roomGroups = RoomGroup.objects.filter(users=user).order_by('-updated_at')
        roomFriends = RoomFriend.objects.filter(user1=user).union(
            RoomFriend.objects.filter(user2=user)
        ).order_by('-updated_at')
        room_data_list = []
        for room in roomGroups:
            content_type = ContentType.objects.get_for_model(room)
            room_data = {
                'id': room.id,
                'type': 'group',
                'name': room.name,
                'avatar': room.avatar.url if room.avatar else 'https://i0.wp.com/sbcf.fr/wp-content/uploads/2018/03/sbcf-default-avatar.png?ssl=1',
                'created_at': room.created_at.isoformat(),
                'updated_at': room.updated_at.isoformat(),
                'mess': [
                        {
                            'id': mess.id,
                            'user': {
                                'id': mess.user.id,
                                'username': mess.user.username,
                                'avatar': mess.user.avatar.url if mess.user.avatar else 'https://i0.wp.com/sbcf.fr/wp-content/uploads/2018/03/sbcf-default-avatar.png?ssl=1',
                            },
                            'content': mess.content.replace('\r\n', '<br>'),
                            'timestamp': mess.timestamp.isoformat()
                        }
                        for mess in Message.objects.filter(content_type=content_type,object_id=room.id).order_by("-timestamp")[:1]
                    ]
            }
            room_data_list.append(room_data)
        
        for room in roomFriends:
            content_type = ContentType.objects.get_for_model(room)
            other_user = room.user1 if room.user1!= request.user else room.user2
            room_data = {
                'id': room.id,
                'type': 'friend',
                'name': other_user.username,
                'other_user_id':other_user.id,
                'avatar': other_user.avatar.url if other_user.avatar else 'https://i0.wp.com/sbcf.fr/wp-content/uploads/2018/03/sbcf-default-avatar.png?ssl=1',
                'created_at': room.created_at.isoformat(),
                'updated_at': room.updated_at.isoformat(),
                'mess': [
                        {
                            'id': mess.id,
                            'user': {
                                'id': mess.user.id,
                                'username': mess.user.username,
                                'avatar': mess.user.avatar.url if mess.user.avatar else 'https://i0.wp.com/sbcf.fr/wp-content/uploads/2018/03/sbcf-default-avatar.png?ssl=1',
                            },
                            'content': mess.content.replace('\r\n', '<br>'),
                            'timestamp': mess.timestamp.isoformat()
                        }
                        for mess in Message.objects.filter(content_type=content_type,object_id=room.id).order_by("-timestamp")[:1]
                    ]
            }
            room_data_list.append(room_data)
        room_data_list.sort(key=lambda x: x['updated_at'], reverse=True)
        return JsonResponse({'success': True, 'rooms': room_data_list})
    else:
        return JsonResponse({'success': False, 'message': 'Please log in'})
    
def get_room(request,roomId,type_room):
    if request.user.is_authenticated:
        user = request.user
        room = None
        if type_room =='group':
            room = RoomGroup.objects.get(id=roomId)
            room_data = {
                    'id': room.id,
                    'name': room.name,
                    'type': room.type_room,
                    'avatar': room.avatar.url if room.avatar else 'https://i0.wp.com/sbcf.fr/wp-content/uploads/2018/03/sbcf-default-avatar.png?ssl=1',
                    'created_at': room.created_at.isoformat(),
                    'updated_at': room.updated_at.isoformat()
                }
        else:
            room = RoomFriend.objects.get(id=roomId)
            other_user = room.user1 if room.user1!= request.user else room.user2
            room_data = {
                    'id': room.id,
                    'name': other_user.username,
                    'other_user_id':other_user.id,
                    'type': room.type_room,
                    'avatar': other_user.avatar.url if other_user.avatar else 'https://i0.wp.com/sbcf.fr/wp-content/uploads/2018/03/sbcf-default-avatar.png?ssl=1',
                    'created_at': room.created_at.isoformat(),
                    'updated_at': room.updated_at.isoformat()
                }


        content_type = ContentType.objects.get_for_model(room)
        messages = Message.objects.filter(content_type=content_type, object_id=room.id).order_by('timestamp')

        messages_data = [
            {
                'id': message.id,
                'user': {
                    'id': message.user.id,
                    'username': message.user.username,
                    'avatar': message.user.avatar.url if message.user.avatar else 'https://i0.wp.com/sbcf.fr/wp-content/uploads/2018/03/sbcf-default-avatar.png?ssl=1',
                },
                'content': message.content.replace('\r\n', '<br>'),
                'audioFile': message.audioFile.url if message.audioFile else None,
                'timestamp': message.timestamp.isoformat()
            } for message in messages[:50]
        ]

        return JsonResponse({'success': True, 'room': room_data,"messages": messages_data})
    else:
        return JsonResponse({'success': False, 'message': 'Please log in'})

def get_friend_requests(request):
    user = get_object_or_404(CustomUser, id=request.user.id)
    friend_requests = NotifyFriend.objects.filter(receiver=user).exclude(status='canceled').order_by('-created_at')
    data = [
        {
            'sender':{
                'id':friend_request.sender.id,
                'username':friend_request.sender.username,
                'avatar':friend_request.sender.avatar.url if friend_request.sender.avatar else 'https://i0.wp.com/sbcf.fr/wp-content/uploads/2018/03/sbcf-default-avatar.png?ssl=1',
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
        receiver = CustomUser.objects.get(id=receiver_id) 
        if sender.is_friend(receiver):
            return JsonResponse({'message': 'were friends.'})
        
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
    except CustomUser.DoesNotExist:
        return JsonResponse({'error': 'User not found.'}, status=404)

def accept_friend_request(request, sender_id):
    receiver = request.user 
    try:
        sender = CustomUser.objects.get(id=sender_id)  
        friend_request = NotifyFriend.objects.filter(sender=sender, receiver=receiver, status='pending').first()
        if friend_request:
            if sender != receiver:
                receiver.add_friend(sender)
                sender.add_friend(receiver)
                friend_request.status = 'accepted'
                friend_request.save()
            return JsonResponse({'message': 'Friend request accepted.'})
        return JsonResponse({'message': 'No pending friend request found.'})
    except CustomUser.DoesNotExist:
        return JsonResponse({'error': 'User not found.'}, status=404)

def refuse_friend_request(request, sender_id):
    receiver = request.user 
    try:
        sender = CustomUser.objects.get(id=sender_id) 
        friend_request = NotifyFriend.objects.filter(sender=sender, receiver=receiver, status='pending').first()
        if friend_request:
            friend_request.status = 'refused'
            friend_request.save()
            return JsonResponse({'message': 'Friend request refused.'})
        return JsonResponse({'message': 'No pending friend request found.'})
    except CustomUser.DoesNotExist:
        return JsonResponse({'error': 'User not found.'}, status=404)
    
def cancel_friend_request(request, receiver_id):
    sender = request.user 
    try:
        receiver = CustomUser.objects.get(id=receiver_id) 
        friend_request = NotifyFriend.objects.filter(sender=sender, receiver=receiver, status='pending').first()
        if friend_request:
            friend_request.delete()
            return JsonResponse({'message': 'Friend request refused.'})
        return JsonResponse({'message': 'No pending friend request found.'})
    except CustomUser.DoesNotExist:
        return JsonResponse({'error': 'User not found.'}, status=404)

def delete_friend_request(request, user_id):
    user1 = request.user
    try:
        user2 = CustomUser.objects.get(id=user_id)
        if user1.is_friend(user2):
            user1.remove_friend(user2)
            user2.remove_friend(user1)
            return JsonResponse({'message': 'Friend deleted successfully'})
        
        return JsonResponse({'message': 'No friend request found.'})

    except CustomUser.DoesNotExist:
        return JsonResponse({'error': 'User not found.'}, status=404)

def check_friend_request_status(request, receiver_id):
    try:
        user1 = request.user  
        user2 = CustomUser.objects.get(id=receiver_id) 
        if user1.is_friend(user2):
            return JsonResponse({'isFriend':True})
        else:
            friend_request_sender = NotifyFriend.objects.filter( sender=user1, receiver=user2).first()
            friend_request_receiver = NotifyFriend.objects.filter( sender=user2, receiver=user1).first()
            if friend_request_sender:
                return JsonResponse({'message':friend_request_sender.status,'errCode':0})
            elif friend_request_receiver:
                return JsonResponse({'message':friend_request_receiver.status,'errCode':1})
            
            return JsonResponse({'message': 'No friend request found.'})

    except CustomUser.DoesNotExist:
        return JsonResponse({'error': 'User not found.'}, status=404)
