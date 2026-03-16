# Railway Environment Variables Configuration

## Required Environment Variables

Add these environment variables in your Railway project dashboard under **Variables**.

---

### Authentication (Supabase)

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...
```

**Where to find these:**
- Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Select your FlexTab project
- Navigate to **Settings → API**
- Copy:
  - `Project URL` → `VITE_SUPABASE_URL`
  - `anon / public` key → `VITE_SUPABASE_ANON_KEY`
  - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

> **Important:** `SUPABASE_SERVICE_ROLE_KEY` is used server-side only to verify JWTs and auto-create user records. Never expose it to the client. If this key is missing, the server falls back to the anon key, which may cause auth failures for upload endpoints.

---

### Database (PostgreSQL)

```
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
```

**Where to find this:**
- In Railway dashboard, go to your PostgreSQL service
- Click the **Connect** tab
- Copy the **Postgres Connection URL**
- Ensure it includes `?sslmode=require` at the end

---

### Application Configuration

```
NODE_ENV=production
PORT=8080
```

> Railway automatically sets `PORT`. The default in this app is `8080`.

---

## Required for File Uploads (Profile Photos & Community Media)

Both the profile photo upload (`POST /api/upload-avatar`) and community media upload (`POST /api/upload-media`) require Cloudflare R2. **Without these, all uploads will return a 500 error.**

```
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=flextab-storage
R2_PUBLIC_URL=https://pub-xxxxxxxxxxxx.r2.dev
```

**Where to find these:**
- Go to [https://dash.cloudflare.com](https://dash.cloudflare.com)
- Navigate to **R2 Object Storage**
- Create a bucket (e.g. `flextab-storage`) if you haven't already
- Go to **Manage R2 API Tokens** to generate `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY`
- Your `R2_ACCOUNT_ID` is shown in the right sidebar of the R2 dashboard
- `R2_PUBLIC_URL` is the public dev URL for your bucket (e.g. `https://pub-xxxx.r2.dev`) — enable public access on the bucket to get this

---

## How to Add Environment Variables in Railway

1. Go to your Railway project dashboard
2. Click on your service/deployment
3. Click the **Variables** tab
4. Click **New Variable**
5. Add each variable name and value
6. Railway will automatically redeploy after saving

---

## Verification

After deploying, check the **Deploy Logs** for these lines:

```
[Server] VITE_SUPABASE_URL: Set
[Server] SUPABASE_SERVICE_ROLE_KEY: Set  (or: MISSING (falling back to anon key))
[Server] R2_ACCOUNT_ID: Set (fbcc4a...)
[Server] R2_ACCESS_KEY_ID: Set
[Server] R2_SECRET_ACCESS_KEY: Set
[Server] R2_PUBLIC_URL: https://pub-xxxx.r2.dev
[Server] Database URL: Set
[Server] Server started successfully
```

If any R2 variable shows `Missing`, file uploads will fail. If `SUPABASE_SERVICE_ROLE_KEY` is missing, upload endpoints may return `401 Unauthorized` for some users.
