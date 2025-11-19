# Reflection Questions Implementation

## Purpose of Reflection Screen

The reflection screen appears after users complete a quiz. Its purpose is to:

1. **Internalize Learning**: Help users reflect on what they learned and make it more meaningful
2. **Self-Assessment**: Allow users to think about their learning experience
3. **Personal Growth**: Encourage mindfulness and self-awareness in the learning process
4. **Adaptive Feedback**: Different questions based on user performance (low score = challenging questions, high score = success questions)

## Implementation

### Database Model

Created `ReflectionQuestion` model in Prisma schema:
- Linked to lessons (one lesson can have multiple reflection questions)
- Categories: `general`, `challenging`, `success`
- Bilingual support (English and Sinhala)
- Multiple options per question
- Active/inactive status

### Backend Changes

1. **Database Schema** (`prisma/schema.prisma`):
   - Added `ReflectionQuestion` model
   - Linked to `Lesson` model
   - Added indexes for performance

2. **Content Controller** (`backend/src/controllers/content.controller.ts`):
   - Removed hardcoded reflection questions
   - Now fetches reflection questions from database
   - Selects question based on user's quiz score:
     - Score < 60% → `challenging` category
     - Score >= 80% → `success` category
     - Otherwise → `general` category

3. **Admin Controller** (`backend/src/controllers/admin.controller.ts`):
   - Updated `createLesson` to accept `reflectionQuestions`
   - Updated `updateLesson` to handle `reflectionQuestions`
   - Reflection questions are created/updated when lesson is saved

### Frontend Changes Needed

The admin UI (`web/src/pages/admin/LessonEditor.tsx`) needs to be updated to:

1. **Display Reflection Questions Section**:
   - Show existing reflection questions grouped by category
   - Allow adding/editing/deleting reflection questions
   - Support all three categories: general, challenging, success

2. **Form Fields**:
   - Category selector (general/challenging/success)
   - Prompt (English and Sinhala)
   - Options (English and Sinhala arrays)
   - Active/Inactive toggle

3. **Data Format**:
   ```typescript
   {
     category: 'general' | 'challenging' | 'success',
     prompt: {
       en: string,
       si: string
     },
     options: {
       en: string[],
       si: string[]
     },
     orderIndex: number,
     isActive: boolean
   }
   ```

### Migration Applied

Migration `20251115105948_add_reflection_questions` has been applied:
- Created `reflection_questions` table
- Added indexes for performance
- Linked to `lessons` table

## Next Steps

1. **Update Admin UI**: Add reflection questions editor to `LessonEditor.tsx`
2. **Test**: Create a lesson with reflection questions and verify they appear correctly
3. **Default Questions**: Consider adding default reflection questions for existing lessons

## Usage

### For Admins

1. Go to Admin → Lessons → Edit Lesson
2. Scroll to "Reflection Questions" section
3. Add reflection questions for each category:
   - **General**: Default questions for all users
   - **Challenging**: Questions for users who scored < 60%
   - **Success**: Questions for users who scored >= 80%
4. Each question needs:
   - Prompt in English and Sinhala
   - Options array in both languages
   - At least one option should be "Other" to allow free text

### For Users

1. Complete a lesson quiz
2. Reflection screen appears automatically
3. Question shown depends on quiz score
4. User selects options and can add free text if "Other" is selected
5. Reflection is saved and lesson is completed

## Benefits

✅ **No Hardcoded Questions**: All questions managed through admin panel
✅ **Flexible**: Admins can customize questions per lesson
✅ **Adaptive**: Different questions based on user performance
✅ **Bilingual**: Full support for English and Sinhala
✅ **Scalable**: Easy to add more categories or questions







