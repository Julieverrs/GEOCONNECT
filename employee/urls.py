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
    path('profile/update/', views.update_profile, name='update_profile'),
    path('apply-job/', views.apply_job, name='apply_job'),  # New URL for job applications
    path('remove-resume/', views.remove_resume, name='remove_resume'),
    path('resume-analyzer/', views.resume_analyzer, name='resume_analyzer'),
]

