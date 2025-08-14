from django.urls import path
from . import views

app_name = 'admin_panel'

urlpatterns = [
    path('', views.admin_dashboard, name='dashboard'),  # Default dashboard
    path('login/', views.admin_login, name='login'),
    path('logout/', views.admin_logout, name='logout'),
    path('dashboard/', views.admin_dashboard, name='dashboard'),
    path('approvals/', views.approval_dashboard, name='approvals'),
    path('employee-approvals/', views.employee_approval_dashboard, name='employee_approvals'),
    
    # Enhanced Admin Panel Features
    path('monitoring/', views.user_monitoring_dashboard, name='user_monitoring'),
    path('jobs/', views.jobs_monitoring, name='jobs_monitoring'),
    path('applications/', views.applications_monitoring, name='applications_monitoring'),
    path('reports/', views.system_reports, name='system_reports'),
    path('export/', views.export_report, name='export_report'),
    
    # View details endpoints
    path('employer/<int:employer_id>/details/', views.get_employer_details, name='get_employer_details'),
    path('employee/<int:employee_id>/details/', views.get_employee_details, name='get_employee_details'),
    path('job-details/<int:job_id>/', views.get_job_details, name='get_job_details'),
    path('application-details/<int:application_id>/', views.get_application_details, name='get_application_details'),
    
    # Test endpoint
    path('test-jobs/', views.test_jobs_data, name='test_jobs'),
    
    # Existing approval endpoints
    path('employer/<int:employer_id>/approve/', views.approve_employer, name='approve_employer'),
    path('employer/<int:employer_id>/reject/', views.reject_employer, name='reject_employer'),
    path('employer/<int:employer_id>/reconsider/', views.reconsider_employer, name='reconsider_employer'),
    
    # Employee approval endpoints
    path('employee/<int:employee_id>/approve/', views.approve_employee, name='approve_employee'),
    path('employee/<int:employee_id>/reject/', views.reject_employee, name='reject_employee'),
    path('employee/<int:employee_id>/reconsider/', views.reconsider_employee, name='reconsider_employee'),
]

