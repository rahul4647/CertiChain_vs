# Google OAuth Setup Guide for CertiChain

## Issue
Getting "403. That's an error. We're sorry, but you do not have access to this document." when clicking "Sign up with Google"

## Solution
You need to configure Google OAuth in both Google Cloud Console and Supabase.

---

## Step 1: Set Up Google Cloud Console

### 1.1 Create a Project (if you haven't already)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Name it "CertiChain" or similar
5. Click "Create"

### 1.2 Enable Google+ API
1. In the left sidebar, go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click on it and click **Enable**

### 1.3 Configure OAuth Consent Screen
1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** (unless you have Google Workspace)
3. Click **Create**

**Fill in the form:**
- **App name:** CertiChain
- **User support email:** Your email
- **App logo:** (optional, can skip for testing)
- **Developer contact information:** Your email
- Click **Save and Continue**

**Scopes:**
- Click **Add or Remove Scopes**
- Add these scopes:
  - `.../auth/userinfo.email`
  - `.../auth/userinfo.profile`
  - `openid`
- Click **Update** → **Save and Continue**

**Test users (for development):**
- Click **Add Users**
- Add your email address and any test emails
- Click **Save and Continue**
- Click **Back to Dashboard**

### 1.4 Create OAuth Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. Select **Application type:** Web application
4. **Name:** CertiChain Web Client

**Authorized JavaScript origins:**
Add these URLs:
```
https://ewtwjfwobqkivrpicvvl.supabase.co
https://cert-image-uploader.preview.emergentagent.com
http://localhost:3000
```

**Authorized redirect URIs:**
Add this Supabase callback URL:
```
https://ewtwjfwobqkivrpicvvl.supabase.co/auth/v1/callback
```

5. Click **Create**
6. **Copy** the `Client ID` and `Client Secret` - you'll need these!

---

## Step 2: Configure Supabase

### 2.1 Enable Google Provider
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `ewtwjfwobqkivrpicvvl`
3. Go to **Authentication** → **Providers**
4. Find **Google** in the list
5. Toggle it **ON**

### 2.2 Add Google Credentials
In the Google provider settings:

**Client ID (OAuth Client ID):**
```
Paste your Client ID from Google Cloud Console
```

**Client Secret (OAuth Client Secret):**
```
Paste your Client Secret from Google Cloud Console
```

**Authorized Redirect URI (already provided by Supabase):**
```
https://ewtwjfwobqkivrpicvvl.supabase.co/auth/v1/callback
```

6. Click **Save**

---

## Step 3: Update Your Frontend Code (if needed)

Your frontend should already have the Supabase client configured. Verify `/app/app_frontend/src/supabaseClient.js`:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Google Sign In Implementation

Your sign-in code should look like this:

```javascript
const handleGoogleSignIn = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/auth/callback'
    }
  })
  
  if (error) {
    console.error('Error signing in with Google:', error)
  }
}
```

---

## Step 4: Test the Integration

1. **Clear browser cache and cookies** for your app
2. Go to your sign-up/login page
3. Click "Sign in with Google"
4. You should see Google's consent screen
5. Select your account
6. Grant permissions
7. You'll be redirected back to your app

---

## Common Issues & Solutions

### Issue: "Redirect URI mismatch"
**Solution:** 
- Make sure the redirect URI in Google Console exactly matches Supabase's callback URL
- Check for typos, extra spaces, or http vs https
- Wait 5-10 minutes after making changes for Google to update

### Issue: "This app isn't verified"
**Solution:** 
- This is normal for apps in development
- Click "Advanced" → "Go to CertiChain (unsafe)"
- For production, you need to verify your app with Google

### Issue: "Access blocked: Authorization Error"
**Solution:**
- Make sure you've added yourself as a test user in OAuth consent screen
- Check that Google+ API is enabled
- Verify all scopes are added

### Issue: Still getting 403
**Solution:**
- Clear all cookies for both Google and your app domain
- Try in incognito/private browsing mode
- Check JavaScript console for detailed errors

---

## Environment Variables Checklist

Make sure these are in `/app/app_frontend/.env`:

```env
REACT_APP_SUPABASE_URL=https://ewtwjfwobqkivrpicvvl.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Step 5: Create Auth Callback Page (if missing)

Create `/app/app_frontend/src/pages/AuthCallbackPage.jsx` if it doesn't exist:

```javascript
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export const AuthCallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Handle the OAuth callback
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // User is logged in, redirect to dashboard
        navigate('/dashboard');
      } else {
        // No session, redirect to login
        navigate('/login');
      }
    });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Completing sign in...</p>
      </div>
    </div>
  );
};
```

Make sure this route exists in your `App.js`:
```javascript
<Route path="/auth/callback" element={<AuthCallbackPage />} />
```

---

## Quick Setup Summary

1. ✅ Google Cloud Console:
   - Create project
   - Enable Google+ API
   - Configure OAuth consent screen
   - Create OAuth credentials
   - Add redirect URIs

2. ✅ Supabase:
   - Enable Google provider
   - Add Client ID and Secret
   - Copy redirect URI

3. ✅ Test:
   - Clear cache
   - Try signing in with Google
   - Check for redirect to dashboard

---

## Need Help?

If you're still having issues:
1. Check browser console for errors (F12)
2. Check Supabase logs in Dashboard → Logs
3. Verify all URLs match exactly (no trailing slashes)
4. Make sure you're using HTTPS in production
5. Wait 5-10 minutes after making changes

---

## Production Checklist

Before going live:
- [ ] Submit app for Google verification
- [ ] Update OAuth consent screen to "In Production"
- [ ] Remove test users (not needed in production)
- [ ] Update redirect URIs to production URLs only
- [ ] Review and minimize OAuth scopes
- [ ] Set up proper error handling
- [ ] Add privacy policy and terms of service links

---

**After completing these steps, your Google Sign-In should work perfectly!** 🎉
