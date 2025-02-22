from django.urls import path
from . import views

urlpatterns = [
    path('secret-admin-login/', views.admin_login, name='admin_login'),
    path('dashboard/', views.admin_dashboard, name='admin_dashboard'),
    path('logout/', views.admin_logout, name='admin_logout'),
    
    # API endpoints
    path('employee/<int:user_id>/', views.get_user_details, {'user_type': 'employee'}, name='get_employee_details'),
    path('employer/<int:user_id>/', views.get_user_details, {'user_type': 'employer'}, name='get_employer_details'),
    path('employee/<int:user_id>/toggle-status/', views.toggle_user_status, {'user_type': 'employee'}, name='toggle_employee_status'),
    path('employer/<int:user_id>/toggle-status/', views.toggle_user_status, {'user_type': 'employer'}, name='toggle_employer_status'),
    path('employer/<int:employer_id>/toggle-verification/', views.toggle_employer_verification, name='toggle_employer_verification'),
    path('employee/<int:user_id>/delete/', views.delete_user, {'user_type': 'employee'}, name='delete_employee'),
    path('employer/<int:user_id>/delete/', views.delete_user, {'user_type': 'employer'}, name='delete_employer'),
]

