from django.urls import path
from . import views

app_name = 'admin_panel'

urlpatterns = [
    path('login/', views.admin_login, name='login'),
    path('logout/', views.admin_logout, name='logout'),
    path('dashboard/', views.admin_dashboard, name='dashboard'),
    path('approvals/', views.approval_dashboard, name='approvals'),
    path('employee-approvals/', views.employee_approval_dashboard, name='employee_approvals'),
    
    # Employee approval endpoints
    path('employee/<int:employee_id>/details/', views.get_employee_details, name='get_employee_details'),
    path('employee/<int:employee_id>/approve/', views.approve_employee, name='approve_employee'),
    path('employee/<int:employee_id>/reject/', views.reject_employee, name='reject_employee'),
    path('employee/<int:employee_id>/reconsider/', views.reconsider_employee, name='reconsider_employee'),
    
    # Existing employer endpoints
    path('employer/<int:employer_id>/details/', views.get_employer_details, name='get_employer_details'),
    path('employer/<int:employer_id>/approve/', views.approve_employer, name='approve_employer'),
    path('employer/<int:employer_id>/reject/', views.reject_employer, name='reject_employer'),
    path('employer/<int:employer_id>/reconsider/', views.reconsider_employer, name='reconsider_employer'),
]

