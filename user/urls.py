# user/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.user_login, name='login'),
    path('logout/', views.user_logout, name='logout'),
    path('profile/', views.profile, name='profile'),
    path('update_avatar/', views.update_avatar, name='update_avatar'),
    path('update_info/', views.update_info, name='update_info'),
    path('change-password/', views.change_password, name='change_password'),

]