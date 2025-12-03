import threading
import time
import os
import re
import traceback
from typing import List, Optional, Tuple
import requests

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

            # Prepare payload with better deliverability settings
            payload = {
                'from': from_addr,
                'to': recipient_list,
                'subject': subject,
                'text': message,
            }
            if html_message:
                payload['html'] = html_message
            
            # Add reply-to header for better deliverability
            # Extract reply-to from from_email if available
            reply_to_match = re.search(r'<(.+?)>', from_email)
            if reply_to_match:
                payload['reply_to'] = reply_to_match.group(1)
            
            print(f"[RESEND] 📤 Sending email via Resend API...")
            print(f"[RESEND] 📤 From: {from_addr}, To: {', '.join(recipient_list)}")
            
            # Check if using default domain and sending to non-owner email
            # Resend free tier restriction: can only send to your own email with default domain
            default_domain_emails = ['onboarding@resend.dev']
            is_default_domain = any(domain in from_addr for domain in default_domain_emails)
            
            if is_default_domain:
                # Get the account owner email from API key or environment
                account_owner_email = os.environ.get('RESEND_ACCOUNT_EMAIL', '')
                if account_owner_email and recipient_list and recipient_list[0] != account_owner_email:
                    warning_msg = (
                        f"⚠️ WARNING: Using default domain (onboarding@resend.dev) can only send to your own email address. "
                        f"To send to other recipients, verify a domain at resend.com/domains"
                    )
                    print(f"[RESEND] {warning_msg}")
            
            # Use Resend API directly via requests (more reliable)
            try:
                headers = {
                    'Authorization': f'Bearer {resend_api_key}',
                    'Content-Type': 'application/json'
                }
                api_url = 'https://api.resend.com/emails'
                
                response = requests.post(api_url, json=payload, headers=headers, timeout=timeout)
                
                # Check for 403 error (domain verification required)
                if response.status_code == 403:
                    error_data = response.json()
                    error_msg = error_data.get('message', 'Domain verification required')
                    result['error'] = f'Resend API error (403): {error_msg}. To send to other recipients, verify a domain at resend.com/domains'
                    result['success'] = False
                    print(f"[RESEND] ❌ 403 Error: {error_msg}")
                    print(f"[RESEND] ❌ Solution: Verify a domain in Resend dashboard to send to other recipients")
                    return
                
                response.raise_for_status()
                resp = response.json()
                
                # Log response for debugging
                print(f"[RESEND] 📥 API Response: {resp}")
                
                # Log success with email ID
                email_id = resp.get('id', 'N/A')
                print(f"[RESEND] ✅ Email sent successfully via Resend!")
                print(f"[RESEND] ✅ Email ID: {email_id}")
                print(f"[RESEND] ✅ Check Resend Dashboard: https://resend.com/emails")
                
                result['success'] = True
                result['error'] = None
                return
            except requests.exceptions.RequestException as e:
                error_msg = f'Resend API request failed: {str(e)}'
                if hasattr(e, 'response') and e.response is not None:
                    try:
                        error_detail = e.response.json()
                        error_msg += f" - {error_detail}"
                    except:
                        error_msg += f" - Status: {e.response.status_code}"
                result['error'] = error_msg
                result['success'] = False
                print(f"[RESEND] ❌ API request failed: {error_msg}")
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
