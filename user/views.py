# music/views.py

from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib import messages
from .forms import CustomUserCreationForm
from django.contrib.auth.forms import AuthenticationForm 
from .forms import UpdateAvatarForm, UpdateInfoForm, ChangePasswordForm

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

def profile(request):
    return render(request, 'user/profile.html')

def update_avatar(request):
    if request.method == 'POST':
        form = UpdateAvatarForm(request.POST, request.FILES)
        if form.is_valid():
            user = request.user
            user.avatar = form.cleaned_data['avatar']
            user.save()
            messages.success(request, "Ảnh đại diện đã được cập nhật thành công.")
            return redirect('profile')
        messages.error(request, "Có lỗi khi cập nhật ảnh đại diện.")
    else:
        form = UpdateAvatarForm()
    return render(request, 'user/update_avatar.html', {'form': form})

def update_info(request):
    if request.method == 'POST':
        form = UpdateInfoForm(request.POST)
        if form.is_valid():
            user = request.user
            user.first_name = form.cleaned_data['first_name']
            user.last_name = form.cleaned_data['last_name']
            user.email = form.cleaned_data['email']
            user.save()
            messages.success(request, "Thông tin đã được cập nhật thành công.")
            return redirect('profile')
        messages.error(request, "Có lỗi khi cập nhật thông tin.")
    else:
        form = UpdateInfoForm()
    return render(request, 'user/update_info.html', {'form': form})

def change_password(request):
    if request.method == 'POST':
        form = ChangePasswordForm(request.POST)
        if form.is_valid():
            user = request.user
            old_password = form.cleaned_data['old_password']
            new_password = form.cleaned_data['new_password']
            if user.check_password(old_password):
                user.set_password(new_password)
                user.save()
                messages.success(request, "Mật khẩu đã được cập nhật thành công.")
                return redirect('profile')
            else:
                messages.error(request, "Mật khẩu cũ không đúng.")
        messages.error(request, "Có lỗi khi cập nhật mật khẩu.")
    else:
        form = ChangePasswordForm()
    return render(request, 'user/change_password.html', {'form': form})
