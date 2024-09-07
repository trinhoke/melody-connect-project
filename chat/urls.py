from django.urls import path
from . import views

urlpatterns = [
    # Add your URL patterns here
    path('',views.getHome,name='home'),
    path('search/', views.search_users, name='search_users'),
    path('create_or_get_room/<int:user_id>/', views.create_or_get_room, name='create_or_get_room'),
    path('get_rooms/', views.get_rooms, name='get_rooms'),
    path('get_room/<str:name_room>/', views.get_room, name='get_room'),
    path('sender_message/', views.sender_message, name='sender_message'),
]