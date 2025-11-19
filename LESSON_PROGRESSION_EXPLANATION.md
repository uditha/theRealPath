# Lesson Progression System - How It Works

## Overview
The lesson progression system determines which lessons are **locked**, **current** (available to start), or **completed** based on your progress through the learning path.

## Core Logic Flow

### 1. Data Loading (`loadPath` function)
When the Path screen loads, it fetches:
- **Worlds data**: All worlds with their chapters
- **User progress summary**: Overall stats (XP, level, streak)
- **User progress records**: Individual lesson statuses (`not_started`, `in_progress`, `completed`)

The progress records are stored in a map: `lessonProgressMap[lessonId] = { status: 'completed' | 'in_progress' | 'not_started' }`

### 2. Lesson Status Determination (`getLessonStatus` function)

The status is determined in this priority order:

#### **Priority 1: Check Progress Status (Highest Priority)**
```typescript
if (progress && progress.status === 'completed') {
  return 'completed'; // ALWAYS return completed - never override
}
if (progress && progress.status === 'in_progress') {
  return 'current';
}
```

**Key Rule**: If a lesson is marked as `completed` in the database, it will ALWAYS show as completed, regardless of other logic.

#### **Priority 2: Find Current Lesson**
If no progress exists or status is `not_started`, the system finds which lesson should be "current":

1. Calls `findCurrentLessonIndex()` to find the first available lesson in the chapter
2. **Double-checks** that the found lesson is not completed (safety check)
3. If the found lesson is completed, it searches for the next non-completed lesson

#### **Priority 3: Cross-Chapter Unlocking**
If all lessons in a chapter are completed, the first lesson of the next chapter becomes available (if previous chapter is completed).

### 3. Finding Current Lesson (`findCurrentLessonIndex` function)

This function loops through lessons in order and finds the first one that should be "current":

**Rules:**
1. **Skip completed lessons**: If `progress.status === 'completed'`, skip it
2. **Return in_progress lessons**: If `progress.status === 'in_progress'`, return that index
3. **Unlock sequentially**: For lessons with no progress:
   - First lesson of first chapter: Always available
   - Other lessons: Available only if ALL previous lessons in the chapter are completed

**Critical Safety**: The function includes multiple checks to ensure completed lessons are NEVER returned as "current".

## How Review and Legendary Work

### Review (+5 XP)
- **Status**: Lesson remains `completed` (doesn't change)
- **XP**: Awards +5 XP bonus
- **Mastery**: Can increase normally based on score
- **Progression**: Does NOT affect lesson progression - completed lessons stay completed

### Legendary (+40 XP)
- **Status**: Lesson remains `completed` (doesn't change)
- **XP**: Awards +40 XP bonus
- **Mastery**: Only increases if you get 100% (perfect score)
- **Progression**: Does NOT affect lesson progression - completed lessons stay completed

## The Fix Applied

### Problem
After completing review/legendary, completed lessons were sometimes showing as "current" (next to do).

### Root Cause
The `findCurrentLessonIndex` function could return an index for a completed lesson if:
1. The progress map was stale (not refreshed)
2. The completion check failed due to timing issues
3. The function didn't properly validate before returning

### Solution
1. **Added priority check**: `getLessonStatus` now ALWAYS checks completion status first
2. **Added double-check**: After `findCurrentLessonIndex` returns, verify the lesson is not completed
3. **Added safety checks**: Multiple validation points to ensure completed lessons are never marked as current
4. **Improved refresh**: The path screen refreshes when focused, ensuring progress map is up-to-date

## Status Definitions

### `completed` (Gold checkmark ✓)
- Lesson has been completed at least once
- Status in database: `status = 'completed'`
- Can be reviewed or done as legendary for bonus XP
- **Never** shows as "current" or "locked"

### `current` (Glowing/animating)
- The next lesson you should do
- Either:
  - Has `status = 'in_progress'` (you started it)
  - OR is the first uncompleted lesson in sequence
- Only ONE lesson per chapter should be "current"

### `locked` (Grey with lock icon)
- Not yet available
- Previous lessons in the chapter are not all completed
- OR previous chapter is not completed (for first lesson of a chapter)

## Example Flow

**Scenario**: You have 10 lessons in Chapter 1

1. **Initial State**:
   - Lesson 1: `current` (first lesson, always available)
   - Lessons 2-10: `locked`

2. **After Completing Lesson 1**:
   - Lesson 1: `completed` ✓
   - Lesson 2: `current` (unlocked because Lesson 1 is completed)
   - Lessons 3-10: `locked`

3. **After Completing Lessons 1-9**:
   - Lessons 1-9: `completed` ✓
   - Lesson 10: `current` (unlocked because all previous are completed)
   - Next chapter's Lesson 1: `locked` (Chapter 1 not fully completed yet)

4. **After Completing All 10 Lessons**:
   - Lessons 1-10: `completed` ✓
   - Next chapter's Lesson 1: `current` (Chapter 1 is fully completed)

5. **After Doing Review on Lesson 5**:
   - Lesson 5: Still `completed` ✓ (status doesn't change)
   - Lesson 5: You get +5 XP
   - Progression: Unchanged (Lesson 5 stays completed, next lesson stays current)

## Key Takeaways

1. **Completed lessons NEVER become current** - they always show as completed
2. **Only ONE lesson per chapter is "current"** - the first uncompleted lesson
3. **Review/Legendary don't change progression** - they only award bonus XP
4. **Progression is sequential** - you must complete lessons in order
5. **Cross-chapter unlocking** - completing a chapter unlocks the next chapter's first lesson








