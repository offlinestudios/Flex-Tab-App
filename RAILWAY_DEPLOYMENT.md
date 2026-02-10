# FlexTab Railway Deployment Guide

This guide will help you deploy your FlexTab workout tracker to Railway.

## Prerequisites

- Railway account (sign up at [railway.app](https://railway.app))
- GitHub repository with your code (already created: `offlinestudios/Flex-Tab-App`)
- Clerk account with API keys
- Cloudflare R2 bucket with credentials

## Step 1: Create Railway Project

1. Log in to [Railway](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose **`offlinestudios/Flex-Tab-App`**
5. Railway will automatically detect it's a Node.js project

## Step 2: Add PostgreSQL Database

1. In your Railway project, click **"New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway will automatically create a PostgreSQL database
3. The `DATABASE_URL` environment variable will be automatically set

**Note:** The app currently uses MySQL/TiDB schema. You'll need to either:
- Use Railway's MySQL plugin instead of PostgreSQL, OR
- Update the database schema to work with PostgreSQL (Drizzle ORM supports both)

## Step 3: Configure Environment Variables

In your Railway project settings, go to **"Variables"** and add these:

### **Clerk Authentication**
```
CLERK_PUBLISHABLE_KEY=pk_test_aHVtb3JvdXMtZ2liYm9uLTkwLmNsZXJrLmFjY291bnRzLmRldiQ
CLERK_SECRET_KEY=sk_test_wy5YhgvyuQptcbqTpjeh3rQ6xGHmV0o5AQqdhIZYaW
VITE_CLERK_PUBLISHABLE_KEY=pk_test_aHVtb3JvdXMtZ2liYm9uLTkwLmNsZXJrLmFjY291bnRzLmRldiQ
```

### **Cloudflare R2 Storage**
```
R2_ACCOUNT_ID=fbcc4ac81a48a912a49e2a99e0ca94c
R2_ACCESS_KEY_ID=17bc82a2f391d84a21c5fb157771d0ee
R2_SECRET_ACCESS_KEY=ae9672c83990d48d9969759e87a0e9aa31c4171057f91a291035a41986d2c414
R2_BUCKET_NAME=flextab-storage
```

### **JWT Secret**
Generate a random string for JWT_SECRET:
```bash
openssl rand -base64 32
```
Then add:
```
JWT_SECRET=your_generated_secret_here
```

### **Server Configuration**
```
NODE_ENV=production
PORT=3000
```

## Step 4: Configure Build & Start Commands

Railway should auto-detect these, but verify in **Settings** → **Deploy**:

**Build Command:**
```bash
pnpm install && pnpm build
```

**Start Command:**
```bash
node dist/index.js
```

## Step 5: Deploy

1. Railway will automatically deploy after you add environment variables
2. Wait for the build to complete (check **Deployments** tab)
3. Once deployed, Railway will provide a public URL (e.g., `https://your-app.railway.app`)

## Step 6: Run Database Migrations

After first deployment, you need to run database migrations:

1. In Railway, go to your project
2. Click on your service
3. Go to **"Settings"** → **"Deploy"**
4. Add a **"Deploy Command"**:
```bash
pnpm db:push
```

Or run it manually via Railway CLI:
```bash
railway run pnpm db:push
```

## Step 7: Configure Clerk Redirect URLs

1. Go to your Clerk dashboard
2. Navigate to **"Domains"** or **"Redirect URLs"**
3. Add your Railway deployment URL:
   - `https://your-app.railway.app`
4. Update allowed redirect URLs to include:
   - `https://your-app.railway.app/app`

## Troubleshooting

### Build Fails
- Check the build logs in Railway's **Deployments** tab
- Ensure all environment variables are set correctly
- Verify `package.json` scripts are correct

### Database Connection Issues
- Verify `DATABASE_URL` is set (should be automatic with Railway PostgreSQL)
- Run `pnpm db:push` to sync schema

### Authentication Not Working
- Verify Clerk environment variables are correct
- Check Clerk dashboard for allowed redirect URLs
- Ensure `VITE_CLERK_PUBLISHABLE_KEY` matches `CLERK_PUBLISHABLE_KEY`

### File Upload Fails
- Verify R2 credentials are correct
- Check R2 bucket permissions in Cloudflare dashboard
- Ensure bucket allows public access if using public URLs

## Cost Estimate

**Railway Free Tier:**
- $5 free credit per month
- Enough for development and low-traffic apps

**Paid Plan:**
- ~$5-10/month for small apps
- Includes PostgreSQL database
- Scales automatically

**Total Monthly Cost:**
- Railway: $5-10
- Cloudflare R2: Free (10GB included)
- Clerk: Free (10,000 MAU)

**Estimated: $5-10/month** for moderate usage

## Next Steps

1. Set up custom domain (optional)
2. Configure SSL/TLS (automatic with Railway)
3. Set up monitoring and alerts
4. Configure automatic deployments from GitHub

## Support

- Railway Docs: https://docs.railway.app
- Clerk Docs: https://clerk.com/docs
- Cloudflare R2 Docs: https://developers.cloudflare.com/r2

---

**Your app is now fully independent from Manus and ready for production!** 🎉
