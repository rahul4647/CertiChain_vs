# How to Create a New Project in Google Cloud Console

## Step-by-Step Guide

### Step 1: Go to Google Cloud Console
1. Open your browser
2. Go to: **https://console.cloud.google.com/**
3. Sign in with your Google account

---

### Step 2: Access Project Selector

**Option A - From the top bar:**
1. Look at the **top-left** of the screen (next to "Google Cloud")
2. You'll see a dropdown that says either:
   - "Select a project" or
   - Your current project name (if you have one)
3. Click on it

**Option B - Direct link:**
- Click here: https://console.cloud.google.com/projectselector2/home/dashboard

---

### Step 3: Create New Project

1. In the project selector popup, click **"NEW PROJECT"** button (usually at the top-right of the popup)

   OR

2. If you're on the project list page, click the **"CREATE PROJECT"** button

---

### Step 4: Fill in Project Details

You'll see a form with these fields:

#### **Project name** (Required)
```
CertiChain
```
- This is what you'll see in your project list
- Can be changed later
- Doesn't need to be unique globally

#### **Project ID** (Auto-generated)
```
certichain-12345 (example)
```
- This is automatically created based on your project name
- **IMPORTANT:** This CANNOT be changed after creation
- Must be globally unique across all Google Cloud projects
- You can click the "EDIT" button to customize it if you want

**Example Project IDs:**
- `certichain-prod-2024`
- `certichain-app`
- `my-certichain`

#### **Organization** (Optional)
```
No organization (or select your organization if you have one)
```
- If you're using a personal Google account, select "No organization"
- If you have Google Workspace, you might see your organization here

#### **Location** (Optional)
```
No organization (default)
```
- This is only relevant if you have an organization
- For personal projects, leave as is

---

### Step 5: Create the Project

1. Review your settings:
   - **Project name:** CertiChain
   - **Project ID:** certichain-xxxxx (remember this!)
   - **Organization:** No organization

2. Click the **"CREATE"** button (blue button at the bottom)

3. Wait 10-30 seconds while Google creates your project
   - You'll see a loading spinner
   - A notification will appear when it's done

---

### Step 6: Verify Project Creation

After creation, you should:

1. See your new project name in the top-left dropdown
2. Get a notification: "Project created successfully"
3. Be automatically switched to your new project

**Verify you're in the right project:**
- Look at the top-left: It should say "CertiChain" (or your project name)
- The URL should include your project ID

---

## What to Do Next (For OAuth Setup)

Now that you have a project, continue with the OAuth setup:

### 1. Enable Google+ API
```
Navigation menu → APIs & Services → Library
Search: "Google+ API"
Click: Enable
```

### 2. Configure OAuth Consent Screen
```
Navigation menu → APIs & Services → OAuth consent screen
```

### 3. Create OAuth Credentials
```
Navigation menu → APIs & Services → Credentials
Click: + CREATE CREDENTIALS → OAuth client ID
```

---

## Common Issues & Solutions

### Issue: "Project ID already exists"
**Solution:** 
- Someone else is using that ID
- Add numbers or your name: `certichain-yourname-2024`
- Try variations: `my-certichain`, `certichain-app`

### Issue: Can't find "NEW PROJECT" button
**Solution:**
- Make sure you're signed in
- Look in the project selector dropdown (top-left)
- Try this direct link: https://console.cloud.google.com/projectcreate

### Issue: "You have reached your project quota"
**Solution:**
- Free accounts can have up to 12 projects
- Delete old unused projects
- Or use an existing project

### Issue: Don't see any options after signing in
**Solution:**
- Accept any terms of service that pop up
- Verify your email if Google asks
- Make sure you're using a valid Google account

---

## Quick Visual Guide

```
1. Click Project Selector (Top-left)
   ↓
2. Click "NEW PROJECT"
   ↓
3. Enter "CertiChain" as name
   ↓
4. Note the auto-generated Project ID
   ↓
5. Click "CREATE"
   ↓
6. Wait for creation (10-30 seconds)
   ↓
7. ✅ Project ready!
```

---

## Important Notes

### Save These Details:
- ✅ **Project Name:** CertiChain
- ✅ **Project ID:** certichain-xxxxx (the auto-generated ID)
- ✅ **Project Number:** (You'll see this on the project dashboard)

### You'll Need These For:
- OAuth setup
- API configuration
- Billing (if needed later)
- Service accounts

### Billing Information:
- Creating a project is **FREE**
- Google Cloud gives you $300 free credits
- OAuth/Authentication features are **FREE** (no billing needed)
- You don't need to enable billing for basic OAuth

---

## After Project Creation Checklist

Once your project is created, you should:

- [ ] Enable Google+ API
- [ ] Configure OAuth consent screen
- [ ] Create OAuth credentials
- [ ] Add authorized redirect URIs
- [ ] Copy Client ID and Secret
- [ ] Configure in Supabase

---

## Need More Help?

### Video Tutorial:
- Search YouTube: "How to create Google Cloud project"
- Google's official guide: https://cloud.google.com/resource-manager/docs/creating-managing-projects

### Direct Links:
- **Create Project:** https://console.cloud.google.com/projectcreate
- **Project List:** https://console.cloud.google.com/projectselector2
- **Dashboard:** https://console.cloud.google.com/home/dashboard

### Still Stuck?
Let me know what screen you're seeing, and I can help you navigate from there!

---

## Next Steps

After creating the project, return to the **GOOGLE_OAUTH_SETUP.md** guide and continue from:
- **Step 1.2: Enable Google+ API**

You're doing great! The hardest part is setting everything up the first time. Once it's done, it will work smoothly! 🚀
