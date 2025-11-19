# Lesson Completion Data Storage - Database Structure

## Overview
Lesson completion data is stored in the `user_progress` table (Prisma model: `UserProgress`). This table tracks each user's progress for every lesson they interact with.

## Database Schema

### UserProgress Model
```prisma
model UserProgress {
  id            String   @id @default(uuid())
  userId        String
  lessonId      String
  status        String   @default("not_started") // 'not_started' | 'in_progress' | 'completed'
  bestScore     Int      @default(0) // 0-100 percentage
  masteryLevel  Int      @default(0) // 0-5 (Duolingo-style mastery)
  lastAttemptAt DateTime?
  completedAt   DateTime?
  nextReviewAt  DateTime? // For spaced repetition
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  lesson        Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@unique([userId, lessonId])  // One progress record per user per lesson
  @@map("user_progress")
}
```

## Field Descriptions

### Primary Fields
- **`id`**: Unique identifier for the progress record
- **`userId`**: Foreign key to the User table
- **`lessonId`**: Foreign key to the Lesson table
- **`@@unique([userId, lessonId])`**: Ensures one progress record per user per lesson

### Status Fields
- **`status`**: Current state of the lesson
  - `'not_started'`: User hasn't started this lesson
  - `'in_progress'`: User has started but not completed
  - `'completed'`: User has completed the lesson

### Performance Fields
- **`bestScore`**: Best score achieved (0-100 percentage)
  - Updated only if new score is higher than previous
  - Formula: `Math.max(previousBestScore, currentScore)`

- **`masteryLevel`**: Mastery level (0-5, Duolingo-style)
  - 0: Not mastered
  - 1-4: Increasing mastery
  - 5: Fully mastered (legendary)
  - Calculated based on score and previous mastery

### Timestamp Fields
- **`lastAttemptAt`**: Last time user attempted the lesson (any attempt)
- **`completedAt`**: First time user completed the lesson
  - Set only on first completion, never updated after
  - Used for daily progress tracking

- **`nextReviewAt`**: When the lesson should be reviewed next (spaced repetition)
  - Calculated based on mastery level
  - Used for review queue

- **`createdAt`**: When the progress record was first created
- **`updatedAt`**: Automatically updated on every change

## Data Flow: How Completion is Stored

### 1. Starting a Lesson (`startLesson` API)
```typescript
// Creates or updates progress record
await prisma.userProgress.upsert({
  where: { userId_lessonId: { userId, lessonId } },
  update: {
    status: 'in_progress',
    lastAttemptAt: new Date(),
  },
  create: {
    userId,
    lessonId,
    status: 'in_progress',
    lastAttemptAt: new Date(),
  },
});
```

**Result**: Status becomes `'in_progress'`, `lastAttemptAt` is set

### 2. Completing a Lesson (`completeLesson` API)
```typescript
// Updates progress record with completion data
await prisma.userProgress.upsert({
  where: { userId_lessonId: { userId, lessonId } },
  update: {
    status: 'completed',                    // Always set to completed
    bestScore: Math.max(previousBestScore, score),  // Keep highest score
    masteryLevel: newMasteryLevel,         // Update mastery
    lastAttemptAt: now,                  // Update attempt time
    completedAt: wasCompleted ? existingProgress?.completedAt : now,  // Set only on first completion
    nextReviewAt: calculateNextReviewDate(newMasteryLevel, lastAttemptAt),  // Calculate review date
  },
  create: {
    userId,
    lessonId,
    status: 'completed',
    bestScore: score,
    masteryLevel: newMasteryLevel,
    lastAttemptAt: now,
    completedAt: now,                     // First completion timestamp
    nextReviewAt: calculateNextReviewDate(newMasteryLevel, null),
  },
});
```

**Key Points**:
- `status` is **always** set to `'completed'` (even for review/legendary)
- `completedAt` is set only on **first completion**, preserved on subsequent attempts
- `bestScore` is updated only if new score is **higher**
- `masteryLevel` can increase based on performance
- `nextReviewAt` is recalculated for spaced repetition

### 3. Review/Legendary Attempts
When doing review or legendary on an already completed lesson:

```typescript
const wasCompleted = existingProgress?.status === 'completed';

// Status stays 'completed' - doesn't change
// completedAt stays the same (first completion date)
// lastAttemptAt is updated (new attempt time)
// bestScore might increase if new score is higher
// masteryLevel might increase (legendary: only if 100%)
```

**Important**: Review/legendary don't create new records - they update the existing one.

## Example Data Records

### First Time Completion
```json
{
  "id": "abc-123",
  "userId": "user-456",
  "lessonId": "lesson-789",
  "status": "completed",
  "bestScore": 85,
  "masteryLevel": 2,
  "lastAttemptAt": "2024-01-15T10:30:00Z",
  "completedAt": "2024-01-15T10:30:00Z",  // First completion
  "nextReviewAt": "2024-01-16T10:30:00Z",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### After Review (Same Lesson)
```json
{
  "id": "abc-123",  // Same record
  "userId": "user-456",
  "lessonId": "lesson-789",
  "status": "completed",  // Still completed
  "bestScore": 85,  // No change (85 > 70)
  "masteryLevel": 3,  // Increased from 2 to 3
  "lastAttemptAt": "2024-01-16T14:20:00Z",  // Updated
  "completedAt": "2024-01-15T10:30:00Z",  // Unchanged (first completion)
  "nextReviewAt": "2024-01-18T14:20:00Z",  // Recalculated
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-16T14:20:00Z"  // Updated
}
```

### After Legendary (Perfect Score)
```json
{
  "id": "abc-123",  // Same record
  "userId": "user-456",
  "lessonId": "lesson-789",
  "status": "completed",  // Still completed
  "bestScore": 100,  // Updated (100 > 85)
  "masteryLevel": 4,  // Increased (perfect score on legendary)
  "lastAttemptAt": "2024-01-17T09:15:00Z",  // Updated
  "completedAt": "2024-01-15T10:30:00Z",  // Unchanged
  "nextReviewAt": "2024-01-20T09:15:00Z",  // Recalculated
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-17T09:15:00Z"  // Updated
}
```

## Querying Completion Data

### Get All User Progress
```typescript
const progress = await prisma.userProgress.findMany({
  where: { userId },
  include: {
    lesson: {
      include: {
        chapter: { include: { world: true } }
      }
    }
  }
});
```

### Get Completed Lessons
```typescript
const completed = await prisma.userProgress.findMany({
  where: {
    userId,
    status: 'completed'
  }
});
```

### Get Lessons Completed Today
```typescript
const todayStart = new Date();
todayStart.setHours(0, 0, 0, 0);

const todayCompleted = await prisma.userProgress.findMany({
  where: {
    userId,
    status: 'completed',
    completedAt: { gte: todayStart }  // Use completedAt, not lastAttemptAt
  }
});
```

### Get Review Queue
```typescript
const now = new Date();
const reviewQueue = await prisma.userProgress.findMany({
  where: {
    userId,
    status: 'completed',  // Only completed lessons need review
    OR: [
      { nextReviewAt: { lte: now } },  // Review date passed
      { masteryLevel: { lt: 5 } }       // Not fully mastered
    ]
  }
});
```

## Key Design Decisions

### 1. One Record Per User Per Lesson
- **Unique constraint**: `@@unique([userId, lessonId])`
- **Benefit**: Simple queries, no duplicates
- **Upsert pattern**: Use `upsert` to create or update

### 2. Status Never Goes Backwards
- `not_started` → `in_progress` → `completed`
- Once `completed`, status stays `completed`
- Review/legendary don't change status

### 3. Preserve First Completion Date
- `completedAt` is set only on first completion
- Preserved even if user does review/legendary later
- Used for daily progress tracking

### 4. Track Best Performance
- `bestScore` always keeps the highest score
- `masteryLevel` can only increase (or stay same)
- Multiple attempts improve mastery, not reset it

### 5. Spaced Repetition Support
- `nextReviewAt` calculated based on mastery level
- Higher mastery = longer time until next review
- Used to build review queue

## Data Integrity

### Constraints
- **Unique**: One progress record per user per lesson
- **Foreign Keys**: `userId` and `lessonId` must exist
- **Cascade Delete**: If user or lesson is deleted, progress is deleted

### Validation
- `status` must be one of: `'not_started'`, `'in_progress'`, `'completed'`
- `bestScore` is 0-100 (percentage)
- `masteryLevel` is 0-5
- `completedAt` is only set when `status === 'completed'`

## Summary

**Storage Model**: One `UserProgress` record per user per lesson
**Status Tracking**: `status` field (`not_started` → `in_progress` → `completed`)
**Performance Tracking**: `bestScore` and `masteryLevel` fields
**Timestamps**: `completedAt` (first completion), `lastAttemptAt` (any attempt)
**Review System**: `nextReviewAt` for spaced repetition

The system ensures:
- ✅ Completed lessons always show as completed
- ✅ Best scores are preserved
- ✅ Mastery increases over time
- ✅ First completion date is preserved
- ✅ Review/legendary don't reset progress








