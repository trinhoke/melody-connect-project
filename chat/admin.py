from django.contrib import admin
from .models import *

# Register your models here.
admin.site.register(RoomGroup)
admin.site.register(RoomFriend)
admin.site.register(Message)
admin.site.register(Friend)
admin.site.register(NotifyFriend)