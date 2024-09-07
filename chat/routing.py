
from django.urls import re_path,path
from . import consumers

websocket_urlpatterns = [
    path('ws/messages/<str:room_name>/', consumers.ChatConsumer.as_asgi()),
]
