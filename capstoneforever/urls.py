from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('employee/', include('employee.urls')),
    path('employer/', include('employer.urls')),
    path('', include('landing.urls')),
    path('secret-admin/', include('admin_panel.urls', namespace='admin_panel')),
]

# This catch-all pattern must be LAST. It serves the Vue app.
urlpatterns.append(re_path(r'^.*', TemplateView.as_view(template_name='index.html')))

# Add this to serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
