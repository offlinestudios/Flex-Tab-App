# Railway Environment Variables Configuration

## Required Environment Variables

Add these environment variables in your Railway project dashboard:

### **Authentication (Clerk)**

```
CLERK_PUBLISHABLE_KEY=pk_live_Y2xlcmsuZmxleHRhYi5hcHA=
CLERK_SECRET_KEY=sk_live_...
VITE_CLERK_PUBLISHABLE_KEY=pk_live_Y2xlcmsuZmxleHRhYi5hcHA=
```

**Where to find these:**
- Go to https://dashboard.clerk.com
- Select your FlexTab application
- Navigate to "API Keys"
- Copy both the Publishable Key and Secret Key

**Important:** 
- `CLERK_PUBLISHABLE_KEY` - Used by server-side Clerk middleware
- `CLERK_SECRET_KEY` - Used for server-side API calls to Clerk
- `VITE_CLERK_PUBLISHABLE_KEY` - Used by client-side React app (must start with `VITE_`)

### **Database (PostgreSQL)**

```
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
```

**Where to find this:**
- In Railway dashboard, go to your PostgreSQL service
- Click on "Connect" tab
- Copy the "Postgres Connection URL"
- Make sure it includes `?sslmode=require` at the end

### **Application Configuration**

```
NODE_ENV=production
PORT=3000
```

**Note:** Railway automatically sets `PORT`, but you can override it if needed.

---

## Optional Environment Variables

These are only needed if you use specific features:

### **Cloudflare R2 Storage** (for file uploads)

```
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=your_bucket_name
```

---

## How to Add Environment Variables in Railway

1. Go to your Railway project dashboard
2. Click on your service/deployment
3. Click on the "Variables" tab
4. Click "New Variable"
5. Add each variable name and value
6. Railway will automatically redeploy after you save

---

## Verification

After adding all variables, check the deployment logs for:

```
[Server] Clerk publishable key: Set
[Server] Database URL: Set
```

If you see "Missing" for any of these, the environment variable wasn't set correctly.
