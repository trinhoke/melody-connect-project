
from django.urls import re_path,path
from . import consumers

websocket_urlpatterns = [
    path('ws/onlineCustomer/<int:id>', consumers.OnlineCustomerConsumer.as_asgi()),
    path('ws/messages/<str:room_name>/', consumers.ChatConsumer.as_asgi()),
]
