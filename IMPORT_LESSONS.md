# Import Lessons to First Chapter

This script will import 10 lessons into the first chapter ("What is Buddhism?") so you can test lesson progress.

## How to Run

1. Make sure your database is set up and the seed script has been run:
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma db seed
   ```

2. Run the import script:
   ```bash
   cd backend
   npx tsx src/scripts/importLessons.ts
   ```

## What It Does

- Finds the first chapter in the first world ("What is Buddhism?")
- Reads lessons from `lessons_1_to_10_template.json`
- Deletes any existing lessons in that chapter (to avoid duplicates)
- Creates all 10 lessons with:
  - Slides (content in English and Sinhala)
  - Questions (single choice, multi-select, true/false)
  - Reflection prompts

## Lesson Order

The 10 lessons will be imported in this order:
1. Buddhism as a path
2. Goals of the Buddhist path
3. Misconceptions removed
4. Prince Siddhartha
5. The Great Renunciation
6. Enlightenment
7. The Buddha as teacher, not god
8. Dhamma as natural law
9. Dhamma as teachings
10. Dhamma as practice

## After Import

Once imported, you can:
- View the lessons in the mobile app Path screen
- Test lesson progression one by one
- Complete lessons and see progress tracking
- Check XP and lesson completion stats

## Troubleshooting

If you get an error about the chapter not found:
- Make sure you've run the seed script first
- Check that the database connection is working
- Verify that World 1 and Chapter 1 exist in your database








