from django.urls import path
from . import views

urlpatterns = [
    # Add your URL patterns here
    path('',views.getHome,name='home')
]