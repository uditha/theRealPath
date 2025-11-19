# How to Add Background Images to Worlds

## Step 1: Add the Image URL to Database

You have two options:

### Option A: Through Web Admin (Recommended)
1. Go to `/admin/worlds` in your web admin
2. Click "Edit" on the Foundations world
3. Add the `backgroundImageUrl` field (if available in the form)
4. Enter your image URL, e.g., `https://example.com/foundations-village.jpg`
5. Save

### Option B: Direct Database Update
```sql
UPDATE worlds 
SET "backgroundImageUrl" = 'https://your-image-url.com/foundations-bg.jpg' 
WHERE "themeKey" = 'foundations';
```

### Option C: Update Seed File
Edit `backend/prisma/seed.ts` and add `backgroundImageUrl` to the world:

```typescript
const world1 = await prisma.world.create({
  data: {
    nameEn: 'Foundations',
    nameSi: 'මූලික කරුණු',
    orderIndex: 1,
    themeKey: 'foundations',
    backgroundImageUrl: 'https://your-image-url.com/foundations-village.jpg', // Add this
    isActive: true,
  },
});
```

## Step 2: Run Database Migration

After adding the field to the schema, run:

```bash
cd backend
npx prisma migrate dev --name add_world_background_image
npx prisma generate
```

## Step 3: Host Your Image

You need to host your image somewhere accessible. Options:

1. **Cloud Storage** (Recommended):
   - Upload to Cloudinary, AWS S3, or similar
   - Get the public URL
   - Use that URL in the database

2. **CDN**:
   - Use a CDN like Cloudflare, Imgix, etc.

3. **Local Server** (Development only):
   - Place image in `backend/public/images/`
   - Serve via Express static files
   - Use URL like `http://localhost:3000/images/foundations-bg.jpg`

## Step 4: Image Requirements

For best results:
- **Aspect Ratio**: 16:9 or 9:16 (portrait for mobile)
- **Resolution**: At least 1080x1920px for mobile
- **Format**: JPG or PNG
- **File Size**: Keep under 2MB for faster loading
- **Style**: Should match the warm, autumnal village aesthetic

## Example Image URLs

```typescript
// Foundations world - Japanese village scene
backgroundImageUrl: 'https://images.unsplash.com/photo-1234567890/...'

// Or use a placeholder service
backgroundImageUrl: 'https://via.placeholder.com/1080x1920/FFE0B2/FF9800?text=Foundations'
```

## How It Works

1. The `GradientBackground` component checks if `theme.backgroundImage` exists
2. If it does, it uses `ImageBackground` to display the image
3. If not, it falls back to the gradient colors
4. A subtle overlay is added for better text readability

## Testing

After adding the image URL:
1. Restart your backend server
2. Refresh the mobile app
3. Navigate to the Path screen
4. The Foundations world should show your background image!










