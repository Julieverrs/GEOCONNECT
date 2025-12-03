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
                print("[RESEND] ❌ RESEND_API_KEY not found in environment variables")
                return

            print(f"[RESEND] ✅ Using Resend API (API Key: {resend_api_key[:10]}...)")

            # Normalize from_email to plain address
            if not from_email:
                result['error'] = 'from_email is required'
                result['success'] = False
                print(f"[RESEND] ❌ from_email is empty or None")
                return
                
            m = re.search(r'<(.+?)>', from_email)
            if m:
                from_addr = m.group(1)
            else:
                from_addr = from_email

            # Validate from address
            if not from_addr or '@' not in from_addr:
                result['error'] = f'Invalid from_email address: {from_addr}'
                result['success'] = False
                print(f"[RESEND] ❌ Invalid from_email address: {from_addr}")
                return

            print(f"[RESEND] 📧 Sending email from: {from_addr}")
            print(f"[RESEND] 📧 Sending email to: {', '.join(recipient_list)}")
            print(f"[RESEND] 📧 Subject: {subject}")

            try:
                from resend import Resend
            except Exception as e:
                result['error'] = f'Resend package import failed: {e}'
                result['success'] = False
                print(f"[RESEND] ❌ Failed to import Resend package: {e}")
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

            print(f"[RESEND] 📤 Sending email payload: from={from_addr}, to={recipient_list}, subject={subject[:50]}...")
            
            resp = client.emails.send(payload)
            
            # Log success with email ID
            # Resend API returns {'id': '...'} on success
            if isinstance(resp, dict) and 'id' in resp:
                email_id = resp['id']
                print(f"[RESEND] ✅ Email sent successfully via Resend!")
                print(f"[RESEND] ✅ Email ID: {email_id}")
                print(f"[RESEND] ✅ Check Resend Dashboard: https://resend.com/emails")
            else:
                print(f"[RESEND] ⚠️ Unexpected response format: {resp}")
                print(f"[RESEND] ✅ Email sent (but response format unexpected)")
            
            result['success'] = True
            result['error'] = None
            return
        except Exception as e:
            result['success'] = False
            error_msg = f'Resend send failed: {e}\n{traceback.format_exc()}'
            result['error'] = error_msg
            print(f"[RESEND] ❌ Error sending email: {e}")
            print(f"[RESEND] ❌ Full error: {traceback.format_exc()}")

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
        print("[RESEND] 🚀 Using Resend API for email sending")
        thread = threading.Thread(target=_send_via_resend)
        thread.daemon = False
        thread.start()
        thread.join(timeout=timeout)
        if thread.is_alive():
            print(f"[RESEND] ❌ Email sending timed out after {timeout} seconds")
            return False, f'Email sending timed out after {timeout} seconds.'
        if result['success']:
            print(f"[RESEND] ✅ Email sent successfully!")
        else:
            print(f"[RESEND] ❌ Email failed: {result['error']}")
        return result['success'], result['error']
    else:
        # No Resend API key -> use Django send_mail (SMTP)
        print("[EMAIL] ⚠️ RESEND_API_KEY not set, falling back to SMTP")
        _send_via_django()
        return result['success'], result['error']
