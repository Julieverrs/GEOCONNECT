from django import template
from django.urls import resolve

register = template.Library()

@register.filter
def exclude_toast_on_login_pages(messages):
    """
    Filter that excludes messages with 'toast:' prefix on login and logout pages
    """
    filtered_messages = []
    for message in messages:
        # Keep all messages, but strip 'toast:' prefix if it exists
        if hasattr(message, 'message'):
            if isinstance(message.message, str) and message.message.startswith('toast:'):
                # Create a new message without the toast prefix for login/logout pages
                message.message = message.message[6:]  # Remove 'toast:' prefix
        filtered_messages.append(message)
    return filtered_messages
