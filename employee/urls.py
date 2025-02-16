from django.urls import path
from . import views

urlpatterns = [
    path('signup/', views.employee_signup, name='employee_signup'),
    path('login/', views.employee_login, name='employee_login'),
    path('home/', views.employee_home, name='employee_home'),
    path('logout/', views.employee_logout, name='employee_logout'),
    path('reset/', views.password_reset, name='password_reset'),
    path('reset/<uidb64>/<token>/', views.password_reset_confirm, name='password_reset_confirm'),
]