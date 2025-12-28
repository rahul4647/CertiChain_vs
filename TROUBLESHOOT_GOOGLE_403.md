# Troubleshooting Google 403 Error - Step by Step

## Current Issue
You're getting: **"403. That's an error. We're sorry, but you do not have access to this document."**

This means Google OAuth is not configured properly yet.

---

## Checklist: What You Need to Complete

### ☐ Step 1: Create Google Cloud Project
- [ ] Go to https://console.cloud.google.com/
- [ ] Create a new project named "CertiChain"
- [ ] Note your Project ID

**Status:** Have you done this? If not, do this first!

---

### ☐ Step 2: Enable Google+ API
- [ ] In Google Cloud Console, go to: **APIs & Services → Library**
- [ ] Search for "Google+ API"
- [ ] Click it and click **Enable**

**Why:** Without this API, Google Sign-In won't work

---

### ☐ Step 3: Configure OAuth Consent Screen
- [ ] Go to: **APIs & Services → OAuth consent screen**
- [ ] Choose **External**
- [ ] Fill in:
  - App name: **CertiChain**
  - User support email: **Your email**
  - Developer contact: **Your email**
- [ ] Click **Save and Continue**
- [ ] **Scopes:** Click **Add or Remove Scopes**
  - Select: `userinfo.email`
  - Select: `userinfo.profile`
  - Select: `openid`
- [ ] Click **Save and Continue**
- [ ] **Test users:** Click **Add Users**
  - Add YOUR email address (the one you'll use to test)
- [ ] Click **Save and Continue**

**Why:** This is required for Google to allow sign-ins

---

### ☐ Step 4: Create OAuth Credentials
- [ ] Go to: **APIs & Services → Credentials**
- [ ] Click **+ CREATE CREDENTIALS**
- [ ] Select **OAuth client ID**
- [ ] Choose **Web application**
- [ ] Name: **CertiChain Web Client**

**Authorized JavaScript origins - Add these 3:**
```
https://certimint.preview.emergentagent.com
```
```
https://ewtwjfwobqkivrpicvvl.supabase.co
```
```
http://localhost:3000
```

**Authorized redirect URIs - Add this 1:**
```
https://ewtwjfwobqkivrpicvvl.supabase.co/auth/v1/callback
```

- [ ] Click **CREATE**
- [ ] **IMPORTANT:** Copy your **Client ID** and **Client Secret**

---

### ☐ Step 5: Configure Supabase
- [ ] Go to https://supabase.com/dashboard
- [ ] Select your project: `ewtwjfwobqkivrpicvvl`
- [ ] Go to **Authentication → Providers**
- [ ] Find **Google** and toggle it **ON**
- [ ] Paste:
  - **Client ID:** (from step 4)
  - **Client Secret:** (from step 4)
- [ ] Click **Save**

---

### ☐ Step 6: Run Database Schema
- [ ] Go to Supabase SQL Editor
- [ ] Copy contents of `/app/backend/schema.sql`
- [ ] Paste and **Run** it
- [ ] Check for success (no errors)

---

### ☐ Step 7: Wait and Test
- [ ] Wait **10 minutes** after saving everything
- [ ] Clear browser cache and cookies
- [ ] Try signing in with Google again

---

## Quick Diagnostic: What's Your Status?

### Question 1: Have you created a Google Cloud Project?
- **Yes** → Continue to Question 2
- **No** → Start here: https://console.cloud.google.com/projectcreate

### Question 2: Have you enabled Google+ API?
- **Yes** → Continue to Question 3
- **No** → Go to: APIs & Services → Library → Search "Google+ API" → Enable

### Question 3: Have you configured OAuth Consent Screen?
- **Yes** → Continue to Question 4
- **No** → Go to: APIs & Services → OAuth consent screen

### Question 4: Have you created OAuth Client ID?
- **Yes** → Continue to Question 5
- **No** → Go to: APIs & Services → Credentials → Create Credentials

### Question 5: Have you added URLs to Google Cloud?
- **Yes** → Continue to Question 6
- **No** → Edit your OAuth Client and add the URLs above

### Question 6: Have you configured Supabase?
- **Yes** → Continue to Question 7
- **No** → Go to: Supabase → Authentication → Providers → Google

### Question 7: Have you waited 10 minutes after saving?
- **Yes** → Continue to Question 8
- **No** → Wait and try again

### Question 8: Have you cleared browser cache?
- **Yes** → Continue troubleshooting below
- **No** → Clear cache and try again

---

## Common Causes of 403 Error

### Cause 1: OAuth Consent Screen Not Configured
**Symptoms:** 403 error immediately when clicking "Sign in with Google"

**Solution:**
1. Go to: APIs & Services → OAuth consent screen
2. Complete ALL steps (App info, Scopes, Test users)
3. Make sure status is NOT "Internal" (use "External")

### Cause 2: Test User Not Added
**Symptoms:** 403 error after selecting your Google account

**Solution:**
1. Go to: OAuth consent screen → Test users
2. Click **Add Users**
3. Add YOUR email address
4. Save and wait 5 minutes

### Cause 3: Google+ API Not Enabled
**Symptoms:** Various errors or blank screen

**Solution:**
1. Go to: APIs & Services → Library
2. Search: "Google+ API"
3. Click Enable

### Cause 4: Wrong URLs in Google Console
**Symptoms:** "redirect_uri_mismatch" or 403 errors

**Solution:**
1. Check your OAuth Client credentials
2. Verify these exact URLs are added:
   - JavaScript origins: `https://certimint.preview.emergentagent.com`
   - Redirect URIs: `https://ewtwjfwobqkivrpicvvl.supabase.co/auth/v1/callback`

### Cause 5: Credentials Not Added to Supabase
**Symptoms:** Error after being redirected back from Google

**Solution:**
1. Go to Supabase → Authentication → Providers → Google
2. Make sure Google is toggled ON
3. Add your Client ID and Client Secret
4. Click Save

---

## Step-by-Step Test

### Test 1: Can you access Google Cloud Console?
1. Go to: https://console.cloud.google.com/
2. Do you see your project "CertiChain"?
   - **Yes** → Good, continue to Test 2
   - **No** → Create project first

### Test 2: Is Google+ API enabled?
1. Go to: APIs & Services → Dashboard
2. Do you see "Google+ API" in enabled APIs?
   - **Yes** → Good, continue to Test 3
   - **No** → Enable it from Library

### Test 3: Is OAuth Consent Screen configured?
1. Go to: APIs & Services → OAuth consent screen
2. Do you see "External" and "Testing" status?
   - **Yes** → Good, continue to Test 4
   - **No** → Complete the consent screen setup

### Test 4: Do you have OAuth Client ID?
1. Go to: APIs & Services → Credentials
2. Do you see an "OAuth 2.0 Client ID" listed?
   - **Yes** → Good, continue to Test 5
   - **No** → Create one

### Test 5: Are URLs added correctly?
1. Click your OAuth Client ID to edit
2. Check "Authorized JavaScript origins":
   - Should have 3 URLs
   - One should be `https://certimint.preview.emergentagent.com`
3. Check "Authorized redirect URIs":
   - Should have 1 URL
   - Should be `https://ewtwjfwobqkivrpicvvl.supabase.co/auth/v1/callback`
   - **Yes** → Good, continue to Test 6
   - **No** → Add them and save

### Test 6: Is Supabase configured?
1. Go to: Supabase → Authentication → Providers
2. Is Google toggle ON and showing "Enabled"?
3. Click Google - do you see Client ID filled in?
   - **Yes** → Good, wait 10 minutes and test
   - **No** → Add credentials from Google Cloud

---

## Still Not Working?

### Additional Checks:

1. **Browser Console Errors:**
   - Open your app in browser
   - Press F12 to open console
   - Click "Sign in with Google"
   - Check for any red errors
   - Share the error message

2. **Network Tab:**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Click "Sign in with Google"
   - Look for failed requests
   - Check the response

3. **Supabase Logs:**
   - Go to Supabase Dashboard
   - Click "Logs" in sidebar
   - Filter for "Auth"
   - Look for error messages

---

## What Happens When It Works

When properly configured, here's the flow:

1. Click "Sign in with Google" on your app
2. Redirected to Google's consent screen
3. See: "CertiChain wants to access your Google Account"
4. Click "Continue"
5. Select your Google account
6. Grant permissions
7. Redirected back to: `https://certimint.preview.emergentagent.com`
8. You're logged in! ✅

---

## Need More Help?

Please tell me:
1. **Which step are you currently on?** (1-7 from checklist above)
2. **What have you completed so far?**
3. **Do you see your project in Google Cloud Console?**
4. **Have you created OAuth credentials yet?**
5. **Any specific error messages in browser console?**

I'll guide you through the exact steps you need! 🚀
