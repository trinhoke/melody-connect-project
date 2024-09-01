from django.urls import path
from . import views

urlpatterns = [
    path("",views.blog,name='blog'),
    path("createNewPost",views.create_new_post,name='createNewPost'),
    path("id=<str:id>/page=<int:page>/",views.get_all_post,name='getPost'),
    path('get_post/<int:id>/', views.get_post_by_id, name='get_post_by_id'),
    path('comment_post', views.comment_post, name='comment_post'),
]