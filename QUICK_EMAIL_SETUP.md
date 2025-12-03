# Quick Email Setup - No Domain Needed! 🚀

## Good News!
You **DON'T need to verify a domain** to start using Resend! You can use Resend's default domain `onboarding@resend.dev` immediately.

---

## Step 1: Set DEFAULT_FROM_EMAIL in Railway

Since you already have `RESEND_API_KEY` set, you just need to set `DEFAULT_FROM_EMAIL`:

1. **Go to Railway Variables** (you're already there!)
2. **Click "+ New Variable"**
3. **Add this variable:**
   - **Variable Name**: `DEFAULT_FROM_EMAIL`
   - **Value**: `Geoconnect <onboarding@resend.dev>`
   - Click **"Add"**

That's it! No domain verification needed.

---

## Step 2: Redeploy

Railway will automatically redeploy, or you can manually trigger it:
- Go to **"Deployments"** tab
- Click **"Redeploy"** on the latest deployment

---

## Step 3: Test It!

1. **Try Password Reset:**
   - Go to your login page
   - Click "Forgot Password"
   - Enter an email
   - Check your inbox!

2. **Check Resend Dashboard:**
   - Go to https://resend.com/emails
   - You should see sent emails with status

---

## Current Setup Status ✅

From your Railway dashboard, I can see you have:
- ✅ `RESEND_API_KEY` - Already set!
- ⚠️ `DEFAULT_FROM_EMAIL` - Needs to be set (or will use default)

---

## What Happens Now?

1. **If you set `DEFAULT_FROM_EMAIL`** → Uses that email
2. **If you DON'T set it** → Code automatically uses `Geoconnect <onboarding@resend.dev>`

Both will work! But it's better to set it explicitly.

---

## Optional: Verify Your Own Domain Later

If you want to use your own domain (like `noreply@yourdomain.com`):

1. **Go to Resend Dashboard** → **Domains**
2. **Add Domain** → Enter your domain
3. **Add DNS Records** → Follow instructions
4. **Wait for Verification** → Usually 5-10 minutes
5. **Update Railway Variable:**
   - Change `DEFAULT_FROM_EMAIL` to: `Geoconnect <noreply@yourdomain.com>`

But this is **optional** - you can use `onboarding@resend.dev` forever if you want!

---

## Limits with Default Domain

- ✅ **100 emails/day** (free tier)
- ✅ **3,000 emails/month** (free tier)
- ✅ **No verification needed**
- ✅ **Works immediately**

This is perfect for most applications!

---

## Troubleshooting

**Emails not sending?**
1. Check Railway logs for errors
2. Check Resend dashboard → Logs
3. Verify `RESEND_API_KEY` is correct
4. Make sure `DEFAULT_FROM_EMAIL` is set

**Want to use your own domain?**
- Follow the "Optional" section above
- It takes about 10 minutes to set up

---

## Summary

**Right Now:**
1. Add `DEFAULT_FROM_EMAIL` = `Geoconnect <onboarding@resend.dev>` in Railway
2. Redeploy
3. Test!

**That's it!** No domain verification needed! 🎉

