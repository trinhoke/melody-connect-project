# music/views.py

from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib import messages
from .forms import CustomUserCreationForm
from django.contrib.auth.forms import AuthenticationForm

def home(request):
    return render(request, 'music/home.html')

def register(request):
    if request.method == "POST":
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, "Đăng ký thành công!")
            return redirect("home")
        messages.error(request, "Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.")
    else:
        form = CustomUserCreationForm()
    return render(request, "user/register.html", {"form": form})

def user_login(request):
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                messages.info(request, f"Bạn đã đăng nhập với tên {username}.")
                return redirect("home")
            else:
                messages.error(request,"Tên đăng nhập hoặc mật khẩu không đúng.")
        else:
            messages.error(request,"Tên đăng nhập hoặc mật khẩu không đúng.")
    form = AuthenticationForm()
    return render(request=request, template_name="user/login.html", context={"form":form})

def user_logout(request):
    logout(request)
    messages.info(request, "Bạn đã đăng xuất thành công.")
    return redirect("home")
