"""
ASGI config for melody_connect project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator
# import melody_connect.routing
import blog.routing  # Import routing của ứng dụng blog


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'melody_connect.settings')


application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(
                blog.routing.websocket_urlpatterns
            )
        )
    ),
})
