from django.urls import path
from . import views

urlpatterns = [
    path('signup/', views.employer_signup, name='employer_signup'),
    path('login/', views.employer_login, name='employer_login'),
    path('home/', views.employer_home, name='employer_home'),
    path('logout/', views.employer_logout, name='employer_logout'),
    path('create-job/', views.create_job, name='create_job'),
    path('search-jobs/', views.search_jobs, name='search_jobs'),
    path('get-job/<int:job_id>/', views.get_job, name='get_job'),
    path('edit-job/<int:job_id>/', views.edit_job, name='edit_job'),
    path('profile/get/', views.get_profile, name='get_profile'),
    path('profile/update/', views.update_profile, name='update_profile'),
    path('profile/change-password/', views.change_password, name='change_password'),
    path('reset/', views.employer_password_reset, name='employer_password_reset'),
    path('reset/<uidb64>/<token>/', views.employer_password_reset_confirm, name='employer_password_reset_confirm'),
    
]
