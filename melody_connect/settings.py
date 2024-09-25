"""
Cài đặt Django cho dự án melody_connect.
"""

from pathlib import Path
from dotenv import load_dotenv
import os
load_dotenv()
# Cài đặt cơ bản
BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = 'django-insecure-0fectfijm=(1(r_)u^(r#4q!9qzru@m^h^$84qd)h%3=)8apfd'
DEBUG = True
ALLOWED_HOSTS = []

# Cấu hình ứng dụng
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'cloudinary_storage',  # Đặt trước django.contrib.staticfiles
    'django.contrib.staticfiles',
    'cloudinary',
    'user',
    'music',
    'blog',
    'chat',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'melody_connect.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'melody_connect.wsgi.application'

# Cấu hình cơ sở dữ liệu
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Cấu hình xác thực mật khẩu
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Cấu hình quốc tế hóa
LANGUAGE_CODE = 'vi-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Cấu hình static files và media
STATIC_URL = '/static/'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Cấu hình khác
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Cấu hình Model
AUTH_USER_MODEL = 'user.CustomUser'

# Cấu hình đăng nhập và đăng xuất
LOGIN_REDIRECT_URL = 'home'
LOGOUT_REDIRECT_URL = 'home'

# Cấu hình Cloudinary
CLOUDINARY_STORAGE = {
    'CLOUD_NAME': os.getenv('CLOUDINARY_CLOUD_NAME'),
    'API_KEY': os.getenv('CLOUDINARY_API_KEY'),
    'API_SECRET': os.getenv('CLOUDINARY_API_SECRET')
}

# Sử dụng Cloudinary làm storage mặc định cho media files
DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'

# Cấu hình cho static files
STATICFILES_STORAGE = 'cloudinary_storage.storage.StaticHashedCloudinaryStorage'