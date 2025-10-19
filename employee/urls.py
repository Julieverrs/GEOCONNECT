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
    path('apply-job/', views.apply_job, name='apply_job'),
    path('remove-resume/', views.remove_resume, name='remove_resume'),
    path('resume-analyzer/', views.resume_analyzer, name='resume_analyzer'),
    path('analyze-resume/', views.analyze_resume, name='analyze_resume'),
    path('get-applied-jobs/', views.get_applied_jobs, name='get_applied_jobs'),
    path('send-contact-message/', views.send_contact_message, name='send_contact_message'),
    path('application-status/', views.application_status, name='application_status'),
    path('job-preferences/', views.job_preferences, name='job_preferences'),
    path('get-job-preferences/', views.get_job_preferences, name='get_job_preferences'),
    path('job-mapping/', views.job_mapping, name='job_mapping'),
    path('resume-builder/', views.resume_builder, name='resume_builder'),
    path('generate-resume-pdf/', views.generate_resume_pdf, name='generate_resume_pdf'),
    path('test-pdf/', views.test_pdf, name='test_pdf'),
    path('notifications/', views.employee_notifications, name='employee_notifications'),
    path('notification/mark-read/', views.mark_notification_read, name='mark_notification_read'),
    path('notification/delete/', views.delete_notification, name='delete_notification'),
    path('profile-settings/', views.profile_settings_view, name='employee_profile_settings'),
    path('job-details/<int:job_id>/', views.job_details, name='job_details'),
]

urlpatterns += [
    path('save-job/', views.save_job, name='save_job'),
    path('unsave-job/', views.unsave_job, name='unsave_job'),
    path('get-saved-jobs/', views.get_saved_jobs, name='get_saved_jobs'),
    path('save-job/<int:job_id>/', views.save_job, name='save_job_with_id'),
    path('unsave-job/<int:job_id>/', views.unsave_job, name='unsave_job_with_id'),
    path('check-saved-job/<int:job_id>/', views.check_saved_job, name='check_saved_job'),
    # Feedback and Rating System URLs
    path('submit-feedback/', views.submit_feedback, name='submit_feedback'),
    path('get-reviews/<int:job_id>/', views.get_reviews, name='get_reviews'),
    path('get-job-feedback-stats/<int:job_id>/', views.get_job_feedback_stats, name='get_job_feedback_stats'),
    # Employer Review System URLs
    path('submit-employer-review/', views.submit_employer_review, name='submit_employer_review'),
    path('get-employer-reviews/<int:job_id>/', views.get_employer_reviews, name='get_employer_reviews'),
    # Messaging System URLs
    path('messages/', views.messages_list, name='messages_list'),
    path('messages/<int:conversation_id>/', views.conversation_detail, name='conversation_detail'),
    path('messages/<int:conversation_id>/send/', views.send_message, name='send_message'),
    path('messages/unread-count/', views.get_unread_count, name='get_unread_count'),
    path('messages/<int:conversation_id>/mark-read/', views.mark_messages_read, name='mark_messages_read'),
]
