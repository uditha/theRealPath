# Quick Setup Guide

## 1. Copy Template

```bash
cp -r template /path/to/your-new-project
cd /path/to/your-new-project
```

## 2. Update Project Names

### Backend
- Edit `backend/package.json` - change name and description
- Edit `docker-compose.yml` - update container names and database name

### Mobile
- Edit `mobile/package.json` - change name
- Edit `mobile/app.json` - update app name, slug, bundle identifiers

### Web
- Edit `web/package.json` - change name
- Edit `web/index.html` - update title

## 3. Backend Setup

```bash
cd backend
npm install
cp env.example .env
# Edit .env with your database credentials
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

## 4. Mobile Setup

```bash
cd mobile
npm install
# Update API_BASE_URL in src/utils/constants.ts
npm start
```

## 5. Web Setup

```bash
cd web
npm install
# Create .env file: VITE_API_BASE_URL=http://localhost:3000/api
npm run dev
```

## 6. Docker (Optional)

```bash
# From project root
docker-compose up -d
docker-compose exec backend npx prisma migrate deploy
```

## Next Steps

1. Update Prisma schema with your data models
2. Add new controllers and routes
3. Create mobile screens
4. Create web pages
5. Customize styling and branding

See README.md for more details!

