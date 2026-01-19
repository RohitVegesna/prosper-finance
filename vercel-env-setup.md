# Vercel Environment Variables Setup

You need to set these environment variables in your Vercel project:

## Required Environment Variables:

1. **NEON_DATABASE_URL**
   ```
   postgresql://neondb_owner:npg_EDpwLS5b6oIU@ep-fragrant-glitter-a9x4dhwz-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require
   ```

2. **SESSION_SECRET** (generate a random string)
   ```
   your-secret-session-key-here-make-it-long-and-random
   ```

3. **NODE_ENV**
   ```
   production
   ```

## How to add these in Vercel:

1. Go to your Vercel dashboard
2. Select your project (prosper-finance-omega)
3. Go to Settings → Environment Variables
4. Add each variable above

## Alternative: Using Vercel CLI

```bash
# Install Vercel CLI if you haven't already
npm i -g vercel

# Login to Vercel
vercel login

# Navigate to your project directory
cd path/to/prosper

# Add environment variables
vercel env add NEON_DATABASE_URL
vercel env add SESSION_SECRET  
vercel env add NODE_ENV

# Redeploy
vercel --prod
```

After setting these environment variables, redeploy your application.