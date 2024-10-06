from django.urls import path
from . import views

urlpatterns = [
    # Add your URL patterns here
    path('',views.getHome,name='chat'),
    path('search/', views.search_users, name='search_users'),
    path('create_or_get_room/<int:user_id>/', views.create_or_get_room, name='create_or_get_room'),
    path('get_rooms/', views.get_rooms, name='get_rooms'),
    path('get_room/<str:name_room>/', views.get_room, name='get_room'),
    path('sender_message/', views.sender_message, name='sender_message'),
    path('get_friend_requests/', views.get_friend_requests, name='get_rooms'),

    path('send_friend_request/<int:receiver_id>/', views.send_friend_request, name='send_friend_request'),
    path('accept_friend_request/<int:sender_id>/', views.accept_friend_request, name='accept_friend_request'),
    path('refuse_friend_request/<int:sender_id>/', views.refuse_friend_request, name='refuse_friend_request'),
    path('cancel_friend_request/<int:receiver_id>/', views.cancel_friend_request, name='cancel_friend_request'),
    path('delete_friend_request/<int:user_id>/', views.delete_friend_request, name='delete_friend_request'),
    path('check_friend_status/<int:receiver_id>/', views.check_friend_request_status, name='check_friend_status'),
]