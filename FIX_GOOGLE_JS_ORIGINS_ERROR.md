# Fixing Google Cloud Console JavaScript Origins Error

## The Problem

You tried to add:
```
https://pro-plan-gateway.preview.emergentagent.com..
                                                                      ^^
                                                                   ERROR!
```

**Those two dots at the end are causing the error!**

---

## The Solution

### Correct URL to Add (Remove the dots):

```
https://pro-plan-gateway.preview.emergentagent.com
```

**Copy the exact URL above** (no trailing dots, no trailing slash)

---

## How to Add Authorized JavaScript Origins Correctly

### Step 1: Go to Credentials
1. In Google Cloud Console, go to:
   ```
   APIs & Services → Credentials
   ```

2. Find your OAuth 2.0 Client ID
3. Click on it to edit

### Step 2: Add JavaScript Origins

Scroll down to **"Authorized JavaScript origins"** section

**Add these THREE URLs one by one:**

#### 1. Your Preview URL:
```
https://pro-plan-gateway.preview.emergentagent.com
```
**Important:**
- ✅ NO trailing slash
- ✅ NO dots at the end
- ✅ Must start with https://
- ✅ No path after .com

#### 2. Your Supabase URL:
```
https://ewtwjfwobqkivrpicvvl.supabase.co
```

#### 3. Localhost (for local testing):
```
http://localhost:3000
```

### Step 3: Click "ADD URI" for Each

After typing each URL:
1. Press **Enter** or click **"+ ADD URI"** button
2. The URL should appear in a blue/gray pill/tag
3. Move to the next URL

### Step 4: Save

1. Scroll to the bottom
2. Click the blue **"SAVE"** button
3. Wait for the success message

---

## Common Google JavaScript Origins Errors

### ❌ Error: "Invalid Origin URI"

**Causes:**
- Trailing slash: `https://example.com/` ❌
- Extra dots: `https://example.com..` ❌
- Path included: `https://example.com/path` ❌
- No protocol: `example.com` ❌
- Wrong protocol: `http://` for a `https://` site ❌

**Solutions:**
```
✅ https://example.com
✅ http://localhost:3000
✅ https://subdomain.example.com
```

### ❌ Error: "Origin must use HTTPS"

**Cause:** Using `http://` for a non-localhost URL

**Solution:**
- Only `localhost` can use `http://`
- All other URLs must use `https://`

```
✅ http://localhost:3000
✅ https://pro-plan-gateway.preview.emergentagent.com
❌ http://19b1b7d9-8e8b-47f8-8448-e334fcded889.preview.emergentagent.com
```

### ❌ Error: "Cannot contain path or query"

**Cause:** Including path or query parameters

**Wrong:**
```
❌ https://example.com/path
❌ https://example.com?query=value
❌ https://example.com/app
❌ https://example.com:3000/
```

**Correct:**
```
✅ https://example.com
✅ https://example.com:3000
```

---

## What Authorized JavaScript Origins Are

### What They Do:
- Allow your website to make OAuth requests to Google
- Validate the domain making the authentication request
- Prevent unauthorized sites from using your OAuth credentials

### Format Rules:
```
protocol://hostname:port
```

**Examples:**
- `https://example.com` ✅
- `https://sub.example.com` ✅
- `http://localhost:3000` ✅
- `https://example.com:8080` ✅

**NOT allowed:**
- `https://example.com/` ❌ (trailing slash)
- `https://example.com/path` ❌ (has path)
- `example.com` ❌ (no protocol)

---

## Step-by-Step: Adding Your URLs

### 1. Copy this URL (without dots):
```
https://pro-plan-gateway.preview.emergentagent.com
```

### 2. In Google Cloud Console:
```
1. APIs & Services → Credentials
2. Click your OAuth 2.0 Client ID
3. Find "Authorized JavaScript origins"
4. Click in the text field
5. Paste the URL
6. Press Enter
7. URL should appear as a tag/pill below
8. Repeat for other URLs
9. Click SAVE at the bottom
```

### 3. Verify It's Added:
- You should see three origins listed:
  ```
  ✅ https://pro-plan-gateway.preview.emergentagent.com
  ✅ https://ewtwjfwobqkivrpicvvl.supabase.co
  ✅ http://localhost:3000
  ```

---

## Authorized Redirect URIs (Different Section!)

**Don't confuse with JavaScript Origins!**

In the **"Authorized redirect URIs"** section, add:

```
https://ewtwjfwobqkivrpicvvl.supabase.co/auth/v1/callback
```

**Note:** This one DOES have a path (`/auth/v1/callback`) - that's correct!

### Why They're Different:

**JavaScript Origins:**
- Where the request comes FROM
- Your website's domain
- NO paths allowed

**Redirect URIs:**
- Where Google sends the user BACK TO
- Supabase's callback endpoint
- MUST include the full path

---

## Final Configuration Should Look Like:

### Authorized JavaScript origins (3 entries):
```
1. https://pro-plan-gateway.preview.emergentagent.com
2. https://ewtwjfwobqkivrpicvvl.supabase.co
3. http://localhost:3000
```

### Authorized redirect URIs (1 entry):
```
1. https://ewtwjfwobqkivrpicvvl.supabase.co/auth/v1/callback
```

---

## Still Getting Errors?

### Check These:

1. **No trailing characters:**
   - ✅ `.com`
   - ❌ `.com.`
   - ❌ `.com..`
   - ❌ `.com/`

2. **Correct protocol:**
   - ✅ `https://` for production URLs
   - ✅ `http://` only for localhost

3. **No copy-paste artifacts:**
   - Sometimes copying adds invisible characters
   - Type the URL manually if needed

4. **Browser issues:**
   - Try a different browser
   - Clear cache and cookies
   - Try incognito mode

### Test Your URL:

Open this in your browser:
```
https://pro-plan-gateway.preview.emergentagent.com
```

If it loads your app, the URL is correct!

---

## Quick Copy-Paste (Use These Exact URLs)

**For JavaScript Origins:**
```
https://pro-plan-gateway.preview.emergentagent.com
```

```
https://ewtwjfwobqkivrpicvvl.supabase.co
```

```
http://localhost:3000
```

**For Redirect URIs:**
```
https://ewtwjfwobqkivrpicvvl.supabase.co/auth/v1/callback
```

---

## After Adding URLs

1. Click **SAVE** button (very important!)
2. Wait 5-10 minutes for changes to propagate
3. Clear your browser cache
4. Try Google Sign-In again

---

## Need More Help?

If you're still seeing errors:
1. Take a screenshot of the exact error message
2. Share it with me
3. I'll help you troubleshoot!

The URL without the trailing dots should work perfectly! 🚀
