# Railway Email Setup Guide - Resend Integration

## Overview
This guide will help you set up Resend email service for your GEOCONNECT application on Railway. Resend is a modern email API that works perfectly with Railway and doesn't require SMTP configuration.

---

## Step 1: Create a Resend Account

1. **Go to Resend Website**
   - Visit: https://resend.com
   - Click "Sign Up" or "Get Started"

2. **Sign Up**
   - Use your email address to create an account
   - Verify your email address

3. **Complete Setup**
   - Follow the onboarding process
   - You'll be taken to the Resend dashboard

---

## Step 2: Get Your Resend API Key

1. **Navigate to API Keys**
   - In the Resend dashboard, go to **Settings** → **API Keys**
   - Or visit: https://resend.com/api-keys

2. **Create a New API Key**
   - Click **"Create API Key"**
   - Give it a name (e.g., "GEOCONNECT Production")
   - Select permissions: **"Sending access"**
   - Click **"Add"**

3. **Copy the API Key**
   - ⚠️ **IMPORTANT**: Copy the API key immediately - you won't be able to see it again!
   - It will look like: `re_123456789abcdefghijklmnopqrstuvwxyz`
   - Save it securely (you'll need it for Railway)

---

## Step 3: Verify Your Domain (Optional but Recommended)

### For Production Use:
1. **Add Domain**
   - Go to **Settings** → **Domains**
   - Click **"Add Domain"**
   - Enter your domain (e.g., `yourdomain.com`)
   - Follow the DNS setup instructions

2. **Add DNS Records**
   - Add the provided DNS records to your domain provider
   - Wait for verification (usually takes a few minutes)

3. **Use Verified Domain**
   - Once verified, update `DEFAULT_FROM_EMAIL` in Railway to use your domain
   - Example: `Geoconnect <noreply@yourdomain.com>`

### For Testing (Quick Start):
- You can use Resend's default domain: `onboarding@resend.dev`
- No verification needed, but limited to 100 emails/day
- Perfect for testing and development

---

## Step 4: Add Environment Variable to Railway

1. **Go to Railway Dashboard**
   - Log in to your Railway account
   - Select your GEOCONNECT project

2. **Open Variables Tab**
   - Click on your service/deployment
   - Go to the **"Variables"** tab

3. **Add RESEND_API_KEY**
   - Click **"New Variable"**
   - **Variable Name**: `RESEND_API_KEY`
   - **Value**: Paste your Resend API key (the one you copied in Step 2)
   - Click **"Add"**

4. **Update DEFAULT_FROM_EMAIL (Optional)**
   - If you verified a domain, update `DEFAULT_FROM_EMAIL`:
     - **Variable Name**: `DEFAULT_FROM_EMAIL`
     - **Value**: `Geoconnect <noreply@yourdomain.com>`
   - If using default domain, it's already set to: `Geoconnect <onboarding@resend.dev>`

5. **Remove SMTP Variables (Optional)**
   - You can remove these if you're not using SMTP:
     - `EMAIL_HOST_USER`
     - `EMAIL_HOST_PASSWORD`
   - Or keep them as fallback (they won't be used if `RESEND_API_KEY` is set)

---

## Step 5: Redeploy Your Application

1. **Trigger Redeploy**
   - Railway will automatically detect the new environment variable
   - Or manually trigger a redeploy:
     - Go to **"Deployments"** tab
     - Click **"Redeploy"** on the latest deployment

2. **Wait for Deployment**
   - Wait for the deployment to complete
   - Check the logs to ensure no errors

---

## Step 6: Test Email Functionality

### Test Password Reset:
1. Go to your application's login page
2. Click "Forgot Password"
3. Enter an email address
4. Check if the email is received

### Test Contact Form:
1. Fill out the contact form
2. Submit it
3. Check if the email is sent to admin

### Check Resend Dashboard:
1. Go to Resend dashboard
2. Navigate to **"Logs"** or **"Emails"**
3. You should see sent emails with status (delivered, bounced, etc.)

---

## Step 7: Monitor Email Delivery

1. **Resend Dashboard**
   - Go to **"Logs"** to see all sent emails
   - Check delivery status, opens, clicks, bounces

2. **Railway Logs**
   - Check Railway logs for any email-related errors
   - Look for messages like: "Email notification sent to..."

3. **Application Logs**
   - Check your Django application logs
   - Look for email success/error messages

---

## Troubleshooting

### Emails Not Sending?

1. **Check API Key**
   - Verify `RESEND_API_KEY` is set correctly in Railway
   - Make sure there are no extra spaces or quotes

2. **Check Resend Dashboard**
   - Go to Resend → Logs
   - Check for error messages
   - Verify API key permissions

3. **Check Railway Logs**
   - Look for error messages in deployment logs
   - Check if `RESEND_API_KEY` is being read correctly

4. **Check Email Limits**
   - Free tier: 100 emails/day
   - If exceeded, upgrade your Resend plan

### Common Errors:

**Error: "RESEND_API_KEY not set"**
- Solution: Make sure the environment variable is set in Railway

**Error: "Resend package import failed"**
- Solution: Check that `resend==2.19.0` is in your `requirements.txt`

**Error: "Invalid API key"**
- Solution: Verify your API key is correct and has sending permissions

**Error: "Domain not verified"**
- Solution: Either verify your domain in Resend or use `onboarding@resend.dev`

---

## Environment Variables Summary

### Required:
- `RESEND_API_KEY` - Your Resend API key

### Optional (for custom domain):
- `DEFAULT_FROM_EMAIL` - Custom from email (e.g., `Geoconnect <noreply@yourdomain.com>`)

### Optional (SMTP fallback - not needed for Railway):
- `EMAIL_HOST_USER` - Can be removed
- `EMAIL_HOST_PASSWORD` - Can be removed

---

## How It Works

1. **Code Checks for RESEND_API_KEY**
   - The `send_email_with_timeout` function in `utils/email_utils.py` checks if `RESEND_API_KEY` is set
   - If set → Uses Resend API
   - If not set → Falls back to Django SMTP (for local development)

2. **Resend API Sends Email**
   - Uses Resend Python SDK to send emails
   - Returns success/error status
   - Handles timeouts gracefully

3. **All Email Functions Updated**
   - Password reset emails
   - Account approval/rejection emails
   - Application status update emails
   - Contact form emails
   - All use Resend when `RESEND_API_KEY` is set

---

## Cost Information

### Resend Pricing:
- **Free Tier**: 100 emails/day, 3,000 emails/month
- **Pro Tier**: $20/month - 50,000 emails/month
- **Business Tier**: Custom pricing

### For Most Applications:
- Free tier is sufficient for testing and small applications
- Upgrade when you need more volume

---

## Next Steps

1. ✅ Set up Resend account
2. ✅ Get API key
3. ✅ Add to Railway environment variables
4. ✅ Redeploy application
5. ✅ Test email functionality
6. ✅ Monitor email delivery
7. ✅ (Optional) Verify your domain for production use

---

## Support

- **Resend Documentation**: https://resend.com/docs
- **Resend Support**: support@resend.com
- **Railway Documentation**: https://docs.railway.app

---

## Quick Checklist

- [ ] Created Resend account
- [ ] Generated API key
- [ ] Added `RESEND_API_KEY` to Railway
- [ ] (Optional) Verified domain
- [ ] (Optional) Updated `DEFAULT_FROM_EMAIL`
- [ ] Redeployed application
- [ ] Tested password reset email
- [ ] Tested contact form email
- [ ] Checked Resend dashboard for sent emails
- [ ] Verified emails are being delivered

---

**Your email system is now ready to work on Railway! 🎉**

