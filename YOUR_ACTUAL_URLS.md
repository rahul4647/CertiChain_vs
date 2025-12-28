# Google OAuth Configuration - Your Actual URLs

## Your Correct Preview URL

```
https://certimint.preview.emergentagent.com
```

**Remove the dots (..) at the end when adding to Google Cloud Console!**

---

## Complete Google Cloud Console Configuration

### Step 1: OAuth Client Configuration

Go to: **Google Cloud Console → APIs & Services → Credentials → Your OAuth Client ID**

### Step 2: Authorized JavaScript Origins

Add these **THREE URLs** (one by one):

#### 1. Your Preview URL:
```
https://certimint.preview.emergentagent.com
```

#### 2. Supabase URL:
```
https://ewtwjfwobqkivrpicvvl.supabase.co
```

#### 3. Localhost (for testing):
```
http://localhost:3000
```

**How to add:**
- Paste each URL in the field
- Press **Enter** or click **+ ADD URI**
- Each URL should appear as a tag/pill
- Click **SAVE** at the bottom

---

### Step 3: Authorized Redirect URIs

Add this **ONE URL**:

```
https://ewtwjfwobqkivrpicvvl.supabase.co/auth/v1/callback
```

**Note:** This one HAS a path (`/auth/v1/callback`) - that's correct!

---

## Your Final Configuration Should Look Like:

### ✅ Authorized JavaScript origins (3 entries):
```
https://certimint.preview.emergentagent.com
https://ewtwjfwobqkivrpicvvl.supabase.co
http://localhost:3000
```

### ✅ Authorized redirect URIs (1 entry):
```
https://ewtwjfwobqkivrpicvvl.supabase.co/auth/v1/callback
```

---

## Update Frontend Environment Variables

Also update your frontend `.env` file if needed:

### File: `/app/app_frontend/.env`

Make sure you have:
```env
REACT_APP_BACKEND_URL=http://localhost:8001
REACT_APP_SUPABASE_URL=https://ewtwjfwobqkivrpicvvl.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3dHdqZndvYnFraXZycGljdnZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMDMwOTYsImV4cCI6MjA4MDc3OTA5Nn0.J5K61Tm6r54a1n0xdkOQeUnfh4d7OKTActiyKsKNLx8
```

---

## After Configuration

1. **Click SAVE** in Google Cloud Console
2. **Wait 5-10 minutes** for changes to propagate
3. **Clear browser cache** and cookies
4. **Go to your preview:** https://certimint.preview.emergentagent.com
5. **Try Google Sign-In** again

---

## Testing Your Setup

### 1. Visit your preview:
```
https://certimint.preview.emergentagent.com
```

### 2. Click "Sign in with Google"

### 3. Expected behavior:
- Google consent screen appears
- Select your account
- Grant permissions
- Redirect back to your app
- You're logged in! ✅

---

## Common Issues After Setup

### Issue: "Redirect URI mismatch"
**Check:**
- Supabase callback URL is exactly: `https://ewtwjfwobqkivrpicvvl.supabase.co/auth/v1/callback`
- No typos or extra characters

### Issue: "Origin mismatch"
**Check:**
- Preview URL is exactly: `https://certimint.preview.emergentagent.com`
- No trailing slashes or dots

### Issue: Still getting 403
**Try:**
- Wait 10 minutes (Google needs time to update)
- Clear all cookies and cache
- Try in incognito/private mode
- Add yourself as a test user in OAuth consent screen

---

## Quick Copy-Paste Reference

### For Google Cloud Console:

**JavaScript Origins (add all 3):**
```
https://certimint.preview.emergentagent.com
https://ewtwjfwobqkivrpicvvl.supabase.co
http://localhost:3000
```

**Redirect URIs (add this 1):**
```
https://ewtwjfwobqkivrpicvvl.supabase.co/auth/v1/callback
```

---

## Summary

Your app is available at:
- **Preview:** https://certimint.preview.emergentagent.com
- **Backend:** http://localhost:8001
- **Frontend (local):** http://localhost:3000

All three need to be added as JavaScript origins in Google Cloud Console for Google Sign-In to work from any of these URLs!

Once configured, your Google OAuth will work perfectly! 🚀
