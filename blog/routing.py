# blog/routing.py
from django.urls import re_path,path
from . import consumers

websocket_urlpatterns = [
    path('ws/comments/<int:post_id>/', consumers.CommentConsumer.as_asgi()),
]
