# Chronicle App Deployment Guide

This guide will help you deploy your Chronicle app to Vercel with both frontend and backend.

## Prerequisites

1. **Vercel CLI**: Install globally
   ```bash
   npm i -g vercel
   ```

2. **Database**: Make sure you have a PostgreSQL database (e.g., Neon, Supabase, Railway)

## Environment Variables

You need to set these environment variables in Vercel:

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add the following variables:

```
DATABASE_URL=your_postgresql_connection_string
NEON_DATABASE_URL=your_postgresql_connection_string (same as above)
SESSION_SECRET=your_random_secret_key_here
NODE_ENV=production
```

## Deployment Steps

### 1. First Time Deployment

```bash
# Login to Vercel
vercel login

# Deploy from project root
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (choose your account)
# - Link to existing project? No
# - Project name? (accept default or enter new name)
# - Directory? ./client (for the frontend)
# - Override settings? No
```

### 2. Set Up Environment Variables

After initial deployment:

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Add all the required environment variables listed above

### 3. Database Migration

Your database should auto-migrate on deployment due to the `vercel-build` script, but if needed:

```bash
# Run migrations manually
npm run db:push
```

### 4. Redeploy

```bash
vercel --prod
```

## Project Structure

```
├── api/
│   └── index.ts          # Vercel serverless API entry point
├── client/               # Frontend React app
├── server/               # Original Express server (for local dev)
├── shared/               # Shared types and schemas
├── migrations/           # Database migrations
├── vercel.json          # Vercel deployment configuration
└── package.json         # Dependencies and scripts
```

## Local Development

For local development, continue using:

```bash
npm run dev
```

This will run your Express server locally. The Vercel configuration only affects production deployments.

## Troubleshooting

### API Routes Not Working

- Make sure your API routes start with `/api/`
- Check Vercel function logs in the dashboard
- Verify environment variables are set correctly

### Database Connection Issues

- Ensure DATABASE_URL is correctly set
- Check if your database allows connections from Vercel's IP ranges
- For Neon: Make sure connection pooling is enabled

### Build Failures

- Check the build logs in Vercel dashboard
- Ensure all dependencies are listed in package.json
- Verify TypeScript compilation with `npm run check`

## Monitoring

- Check Vercel function logs in your dashboard
- Monitor your database connection limits
- Set up alerts for failed deployments

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify all environment variables
3. Test API endpoints manually
4. Check database connection