from django.urls import path
from . import views

urlpatterns = [
    path('secret-admin-login/', views.admin_login, name='admin_login'),
    path('secret-admin-signup/', views.admin_signup, name='admin_signup'),
    path('dashboard/', views.admin_dashboard, name='admin_dashboard'),
    path('logout/', views.admin_logout, name='admin_logout'),
]

