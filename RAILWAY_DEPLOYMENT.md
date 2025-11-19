# Railway Deployment Guide

This guide will help you deploy your application to Railway.

## Prerequisites

1. A Railway account (sign up at [railway.app](https://railway.app))
2. Railway CLI installed (optional, but recommended):
   ```bash
   npm i -g @railway/cli
   ```

## Project Structure

This project consists of:
- **Backend API** (`backend/`) - Node.js/Express/TypeScript API
- **Web Frontend** (`web/`) - React/Vite application
- **Mobile App** (`mobile/`) - React Native (not deployed to Railway)

## Deployment Steps

### 1. Backend API Deployment

#### Option A: Using Railway Dashboard (Recommended)

1. **Create a New Project**
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo" (if connected) or "Empty Project"

2. **Add PostgreSQL Database**
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway will automatically create a `DATABASE_URL` environment variable

3. **Add Redis (Optional but Recommended)**
   - Click "New" → "Database" → "Add Redis"
   - Railway will automatically create a `REDIS_URL` environment variable

4. **Deploy Backend Service**
   - Click "New" → "GitHub Repo" (or "Empty Service")
   - Select your repository
   - Railway will auto-detect the Dockerfile in `backend/`
   - Or manually set:
     - **Root Directory**: `backend`
     - **Dockerfile Path**: `Dockerfile`

5. **Configure Environment Variables**
   - Go to your backend service → "Variables"
   - Add the following variables:

   ```env
   # Database (automatically set by Railway PostgreSQL service)
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   
   # Redis (if you added Redis service)
   REDIS_URL=${{Redis.REDIS_URL}}
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   
   # Server Configuration
   PORT=3000
   NODE_ENV=production
   HOST=0.0.0.0
   
   # CORS - Update with your frontend URLs
   CORS_ORIGIN=https://your-web-app.railway.app,https://your-mobile-app-domain.com
   
   # Google OAuth (if using)
   GOOGLE_CLIENT_ID=your-google-client-id
   ```

6. **Configure Service Settings**
   - Go to "Settings" → "Deploy"
   - Ensure "Root Directory" is set to `backend` (if deploying from repo root)
   - Or set "Dockerfile Path" to `backend/Dockerfile`

#### Option B: Using Railway CLI

```bash
# Login to Railway
railway login

# Initialize Railway in your project
railway init

# Link to existing project (or create new)
railway link

# Add PostgreSQL
railway add postgresql

# Add Redis (optional)
railway add redis

# Set environment variables
railway variables set JWT_SECRET=your-super-secret-jwt-key
railway variables set JWT_EXPIRES_IN=7d
railway variables set NODE_ENV=production
railway variables set CORS_ORIGIN=https://your-web-app.railway.app

# Deploy
railway up
```

### 2. Web Frontend Deployment

#### Option A: Deploy as Static Site (Recommended)

1. **Create a New Service**
   - In your Railway project, click "New" → "GitHub Repo"
   - Select your repository

2. **Configure Build Settings**
   - **Root Directory**: `web`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npx serve -s dist -l 3000`
   - **Output Directory**: `dist`

3. **Install Serve Package**
   - Add to `web/package.json` dependencies:
     ```json
     "serve": "^14.2.0"
     ```

4. **Set Environment Variables**
   - In Railway service settings → "Variables", add:
     ```env
     VITE_API_BASE_URL=https://your-backend.railway.app/api
     ```
   - **Important**: The URL must include `/api` suffix as your backend routes are under `/api`

#### Option B: Deploy with Dockerfile

1. **Create a New Service**
   - In your Railway project, click "New" → "GitHub Repo"
   - Select your repository

2. **Configure Service**
   - **Root Directory**: `web`
   - **Dockerfile Path**: `Dockerfile`

3. **Set Environment Variables**
   - In Railway service settings → "Variables", add:
     ```env
     VITE_API_BASE_URL=https://your-backend.railway.app/api
     ```
   - **Important**: The URL must include `/api` suffix as your backend routes are under `/api`

### 3. Configure Domain Names

1. **Backend API**
   - Go to your backend service → "Settings" → "Networking"
   - Click "Generate Domain" or add a custom domain
   - Update `CORS_ORIGIN` in backend environment variables

2. **Web Frontend**
   - Go to your web service → "Settings" → "Networking"
   - Click "Generate Domain" or add a custom domain
   - Update your frontend API URL configuration

## Environment Variables Reference

### Backend Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Auto-set by Railway |
| `JWT_SECRET` | Secret key for JWT tokens | `your-secret-key` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `production` |
| `CORS_ORIGIN` | Allowed CORS origins | `https://your-app.railway.app` |

### Backend Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_URL` | Redis connection string | Auto-set by Railway |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `HOST` | Server host | `0.0.0.0` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | - |

### Web Frontend Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL (must include `/api` suffix) | `https://your-backend.railway.app/api` |

## Database Migrations

Database migrations run automatically on deployment via the startup script in the Dockerfile. The script:
1. Runs `prisma migrate deploy` to apply pending migrations
2. Retries on failure (waits 5 seconds)
3. Starts the server after successful migration

## Monitoring and Logs

- **View Logs**: Go to your service → "Deployments" → Click on a deployment → "View Logs"
- **Metrics**: Railway provides CPU, Memory, and Network metrics in the dashboard
- **Health Check**: Your backend has a `/health` endpoint that Railway can use

## Troubleshooting

### Backend Issues

1. **Migrations Failing**
   - Check database connection string
   - Ensure PostgreSQL service is running
   - Check logs for specific error messages

2. **Server Not Starting**
   - Verify all required environment variables are set
   - Check logs for startup errors
   - Ensure `PORT` is set correctly

3. **CORS Errors**
   - Verify `CORS_ORIGIN` includes your frontend domain
   - Check that frontend is using the correct API URL

### Frontend Issues

1. **Build Failing**
   - Check build logs for TypeScript errors
   - Ensure all dependencies are in `package.json`
   - Verify Node.js version compatibility

2. **API Connection Errors**
   - Verify `VITE_API_BASE_URL` is set correctly (must include `/api` suffix)
   - Check backend service is running
   - Verify CORS configuration includes your frontend domain

## Cost Optimization

- Railway offers a free tier with $5/month credit
- PostgreSQL and Redis services are included
- Monitor usage in the Railway dashboard
- Consider using Railway's sleep feature for development environments

## Security Best Practices

1. **Never commit secrets**: Use Railway environment variables
2. **Use strong JWT secrets**: Generate random strings
3. **Configure CORS properly**: Only allow your frontend domains
4. **Enable HTTPS**: Railway provides SSL certificates automatically
5. **Regular updates**: Keep dependencies updated

## Next Steps

1. Set up monitoring and alerts
2. Configure custom domains
3. Set up CI/CD for automatic deployments
4. Configure backup strategies for your database
5. Set up staging environment

## Support

- Railway Documentation: [docs.railway.app](https://docs.railway.app)
- Railway Discord: [discord.gg/railway](https://discord.gg/railway)
- Railway Status: [status.railway.app](https://status.railway.app)

