import json
from channels.generic.websocket import AsyncWebsocketConsumer

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'blog_{self.room_name}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        data = text_data_json.get('data', 'No data provided')
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'message',
                'message': data
            }
        )

    async def message(self, event):
        message = event['message']
        await self.send(text_data=json.dumps({
            'message': message
        }))


class OnlineCustomerConsumer(AsyncWebsocketConsumer):
    online_users = set()  

    async def connect(self):
        self.room_name = 'onlineCustomer'
        await self.channel_layer.group_add(self.room_name, self.channel_name)
        await self.accept()

        user_id = self.scope['user'].id
        OnlineCustomerConsumer.online_users.add(user_id) 

        await self.send_online_user_ids()

    async def disconnect(self, close_code):
        user_id = self.scope['user'].id
        OnlineCustomerConsumer.online_users.discard(user_id)  

        await self.send_online_user_ids()

    async def send_online_user_ids(self):
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': 'broadcast_online_user_ids',
                'online_user_ids': list(OnlineCustomerConsumer.online_users)
            }
        )

    async def broadcast_online_user_ids(self, event):
        online_user_ids = event['online_user_ids']
        await self.send(text_data=json.dumps({
            'online_user_ids': online_user_ids
        }))
