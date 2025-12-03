import threading
import time
import os
import re
import traceback
from typing import List, Optional, Tuple

from django.core.mail import send_mail as django_send_mail


def send_email_with_timeout(
    subject: str,
    message: str,
    from_email: str,
    recipient_list: List[str],
    html_message: Optional[str] = None,
    timeout: int = 12,
) -> Tuple[bool, Optional[str]]:
    """Send email using Resend API when available, otherwise fall back to Django SMTP.

    Returns (success: bool, error_message: Optional[str]).
    """
    result = {"success": False, "error": None}

    def _send_via_resend():
        try:
            resend_api_key = os.environ.get('RESEND_API_KEY')
            if not resend_api_key:
                result['error'] = 'RESEND_API_KEY not set'
                result['success'] = False
                return

            # Normalize from_email to plain address
            m = re.search(r'<(.+?)>', from_email)
            if m:
                from_addr = m.group(1)
            else:
                from_addr = from_email

            try:
                from resend import Resend
            except Exception as e:
                result['error'] = f'Resend package import failed: {e}'
                result['success'] = False
                return

            client = Resend(api_key=resend_api_key)
            payload = {
                'from': from_addr,
                'to': recipient_list,
                'subject': subject,
                'text': message,
            }
            if html_message:
                payload['html'] = html_message

            resp = client.emails.send(payload)
            result['success'] = True
            result['error'] = None
            return
        except Exception as e:
            result['success'] = False
            result['error'] = f'Resend send failed: {e}\n{traceback.format_exc()}'

    def _send_via_django():
        try:
            django_send_mail(
                subject,
                message,
                from_email,
                recipient_list,
                html_message=html_message,
                fail_silently=False,
            )
            result['success'] = True
            result['error'] = None
        except Exception as e:
            result['success'] = False
            result['error'] = f'Django send_mail failed: {e}\n{traceback.format_exc()}'

    # Prefer Resend when API key exists, otherwise fall back to Django smtp
    if os.environ.get('RESEND_API_KEY'):
        thread = threading.Thread(target=_send_via_resend)
        thread.daemon = False
        thread.start()
        thread.join(timeout=timeout)
        if thread.is_alive():
            return False, f'Email sending timed out after {timeout} seconds.'
        return result['success'], result['error']
    else:
        # No Resend API key -> use Django send_mail (SMTP)
        _send_via_django()
        return result['success'], result['error']
