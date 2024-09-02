# blog/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from models import *

class BlogConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'blog_{self.room_name}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message
            }
        )

    async def chat_message(self, event):
        message = event['message']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message
        }))

class CommentConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.post_id = self.scope['url_route']['kwargs']['post_id']
        self.room_group_name = f'post_{self.post_id}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        content = text_data_json['content']
        author = text_data_json['author']

        # Save the comment
        post = Post.objects.get(id=self.post_id)
        comment = Comment.objects.create(
            post=post,
            author=author,
            content=content
        )

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'comment_message',
                'comment': {
                    'id': comment.id,
                    'author': comment.author,
                    'content': comment.content,
                    'created_at': format(comment.created_at, 'd/m/Y H:i')
                }
            }
        )

    # Receive message from room group
    async def comment_message(self, event):
        comment = event['comment']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'comment': comment
        }))