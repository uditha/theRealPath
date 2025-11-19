# Full-Stack App Template

A reusable template for building full-stack applications with:
- **Backend**: Node.js + Express + TypeScript + Prisma + PostgreSQL
- **Mobile**: React Native (Expo) + TypeScript
- **Web**: React + Vite + TypeScript

## 🚀 Quick Start

### 1. Copy Template to New Project

```bash
# Copy the template folder to your new project location
cp -r template /path/to/your-new-project
cd /path/to/your-new-project
```

### 2. Update Project Names

**Backend (`backend/package.json`):**
```json
{
  "name": "your-app-backend",
  "description": "Backend API for Your App"
}
```

**Mobile (`mobile/package.json`):**
```json
{
  "name": "your-app-mobile"
}
```

**Web (`web/package.json`):**
```json
{
  "name": "your-app-web"
}
```

**Docker (`docker-compose.yml`):**
- Update container names
- Update database name
- Update network name

### 3. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

### 4. Setup Mobile

```bash
cd mobile
npm install
# Update API_BASE_URL in src/utils/constants.ts
npm start
```

### 5. Setup Web

```bash
cd web
npm install
# Create .env file with VITE_API_BASE_URL=http://localhost:3000/api
npm run dev
```

### 6. Docker Setup (Optional)

```bash
# From project root
docker-compose up -d
docker-compose exec backend npx prisma migrate deploy
```

## 📁 Project Structure

```
your-app/
├── backend/          # Node.js + Express + TypeScript backend
│   ├── src/
│   │   ├── config/       # Database, Redis configs
│   │   ├── controllers/  # Route controllers
│   │   ├── routes/       # API routes
│   │   ├── middleware/  # Auth, validation, rate limiting
│   │   ├── services/     # Business logic
│   │   ├── utils/        # Utilities (logger, etc.)
│   │   └── server.ts     # Express app entry point
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   └── package.json
├── mobile/          # React Native (Expo) mobile app
│   └── src/
│       ├── screens/      # Screen components
│       ├── components/   # Reusable components
│       ├── services/     # API services
│       ├── context/      # React contexts
│       ├── navigation/   # Navigation setup
│       └── utils/        # Utilities
├── web/             # React admin web dashboard
│   └── src/
│       ├── pages/       # Page components
│       ├── components/   # Reusable components
│       ├── services/     # API services
│       ├── context/      # React contexts
│       └── lib/         # Utilities
└── docker-compose.yml
```

## ✨ What's Included

### Backend
- ✅ User authentication (register/login)
- ✅ JWT token authentication
- ✅ Password hashing with bcrypt
- ✅ Google OAuth (optional)
- ✅ Rate limiting middleware
- ✅ Request validation
- ✅ Winston logger
- ✅ Prisma ORM setup
- ✅ PostgreSQL database
- ✅ Redis caching (optional)
- ✅ Docker support
- ✅ Health check endpoint

### Mobile
- ✅ Login/Register screens
- ✅ Auth context with token management
- ✅ API service with interceptors
- ✅ Navigation setup
- ✅ Theme context
- ✅ Error handling
- ✅ AsyncStorage for token persistence

### Web
- ✅ Login page
- ✅ Auth context
- ✅ API service with interceptors
- ✅ Protected routes
- ✅ TailwindCSS setup
- ✅ Modern UI components

## 🔧 Environment Variables

### Backend (`.env`)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/your_app_db?schema=public"
REDIS_URL="redis://localhost:6379"  # Optional
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=development
CORS_ORIGIN="http://localhost:5173,http://localhost:19006"
GOOGLE_CLIENT_ID="your-google-client-id"  # Optional
```

### Mobile
Update `src/utils/constants.ts`:
```typescript
export const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api'
  : 'https://your-production-api.com/api';
```

### Web (`.env`)
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

## 📝 Next Steps

1. **Update Prisma Schema**: Add your data models in `backend/prisma/schema.prisma`
2. **Create Controllers**: Add new controllers in `backend/src/controllers/`
3. **Create Routes**: Add new routes in `backend/src/routes/`
4. **Add Mobile Screens**: Create new screens in `mobile/src/screens/`
5. **Add Web Pages**: Create new pages in `web/src/pages/`
6. **Customize Styling**: Update themes and styles

## 🛠️ Development Commands

### Backend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio
```

### Mobile
```bash
npm start            # Start Expo dev server
npm run ios          # Run on iOS
npm run android      # Run on Android
```

### Web
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

## 🐳 Docker Commands

```bash
docker-compose up -d              # Start all services
docker-compose down               # Stop all services
docker-compose logs -f backend    # View backend logs
docker-compose exec backend sh     # Access backend container
```

## 📚 API Endpoints (Included)

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/google` - Google OAuth login
- `GET /api/auth/profile` - Get user profile (requires auth)
- `PUT /api/auth/profile` - Update user profile (requires auth)

### Health Check
- `GET /health` - Server health check

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS configuration
- Input validation
- SQL injection protection (Prisma)

## 📦 Tech Stack

### Backend
- Node.js 20.5+
- Express 5.0+
- TypeScript 5.2+
- PostgreSQL 16+
- Prisma 5.x
- Redis 7.x (optional)
- JWT authentication

### Mobile
- Expo SDK 54
- React Native 0.81+
- TypeScript 5.9+
- React Navigation 6.x

### Web
- React 19
- Vite 7.x
- TypeScript 5.9+
- TailwindCSS
- React Router 7.x

## 🎯 Customization Guide

1. **Change App Name**: Update all `package.json` files
2. **Update Database Schema**: Edit `backend/prisma/schema.prisma`
3. **Add New Features**: Follow the existing patterns
4. **Customize UI**: Update theme files and components
5. **Add Environment Variables**: Update `.env` files

## 📄 License

ISC

---

**Happy Coding! 🚀**

