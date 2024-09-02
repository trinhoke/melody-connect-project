# blog/routing.py
from django.urls import re_path,path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/blog/(?P<room_name>\w+)/$', consumers.BlogConsumer.as_asgi()),
    path('ws/comments/<int:post_id>/', consumers.CommentConsumer.as_asgi()),
]
