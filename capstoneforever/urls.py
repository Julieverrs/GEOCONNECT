from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('employee/', include('employee.urls')),
    path('employer/', include('employer.urls')),
    path('', include('landing.urls')),
    path('secret-admin/', include('admin_panel.urls')),  # Updated this line
]