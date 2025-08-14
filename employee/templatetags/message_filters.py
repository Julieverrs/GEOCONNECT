from django import template
from django.urls import resolve
import re

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

@register.filter
def clean_corrupted_text(text):
    """
    Clean corrupted text by removing extra quotes and special characters
    """
    if not text:
        return ""
    
    # Convert to string if it's not already
    text = str(text)
    
    # Remove extra single quotes that appear between characters
    # This pattern matches single quotes that are surrounded by other characters
    text = re.sub(r'(?<=\w)\'(?=\w)', '', text)
    
    # Remove multiple consecutive single quotes
    text = re.sub(r'\'{2,}', '', text)
    
    # Remove single quotes at the beginning and end of words
    text = re.sub(r'\'\b|\b\'', '', text)
    
    # Clean up extra spaces
    text = re.sub(r'\s+', ' ', text)
    
    # Strip leading and trailing whitespace
    text = text.strip()
    
    return text
