from django.urls import path
from . import views

urlpatterns = [
    path('signup/', views.employee_signup, name='employee_signup'),
    path('login/', views.employee_login, name='employee_login'),
    path('home/', views.employee_home, name='employee_home'),
    path('logout/', views.employee_logout, name='employee_logout'),
    path('reset/', views.password_reset, name='password_reset'),
    path('reset/<uidb64>/<token>/', views.password_reset_confirm, name='password_reset_confirm'),
    path('filter-jobs/', views.filter_jobs, name='filter_jobs'),
    path('update-profile/', views.update_profile, name='employee_update_profile'),  # Updated this line
    path('apply-job/', views.apply_job, name='apply_job'),  # New URL for job applications
]

