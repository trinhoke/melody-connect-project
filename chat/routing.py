
from django.urls import re_path,path
from . import consumers

websocket_urlpatterns = [
    path('ws/onlineCustomer/<int:id>', consumers.OnlineCustomerConsumer.as_asgi()),
    path('ws/createRoom/<int:id>', consumers.CreateRoomConsumer.as_asgi()),
    path('ws/messages/<str:room_name>/<str:type_room>', consumers.ChatConsumer.as_asgi()),
]
