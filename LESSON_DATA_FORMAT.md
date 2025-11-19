# Lesson Data JSON Format Guide

This document explains the JSON format for creating lessons in the RealPath application.

## Complete Lesson Structure

```json
{
  "chapterId": "uuid-of-chapter",
  "slug": "unique-slug-for-lesson",
  "titleEn": "Lesson Title in English",
  "titleSi": "Lesson Title in Sinhala",
  "orderIndex": 1,
  "xpReward": 10,
  "slides": [...],
  "questions": [...],
  "reflection": {...}
}
```

## Field Descriptions

### Lesson Fields
- **chapterId** (string, required): UUID of the chapter this lesson belongs to
- **slug** (string, required): URL-friendly identifier (e.g., "buddhism-as-a-path")
- **titleEn** (string, required): Lesson title in English
- **titleSi** (string, required): Lesson title in Sinhala
- **orderIndex** (number, required): Position within chapter (1, 2, 3, ...)
- **xpReward** (number, optional): XP points for completing (default: 10)
- **slides** (array, optional): Array of slide objects
- **questions** (array, optional): Array of question objects
- **reflection** (object, optional): Reflection prompt and options

## Slide Format

```json
{
  "orderIndex": 1,
  "type": "explanation",
  "contentEn": "English content text",
  "contentSi": "Sinhala content text",
  "imageUrl": "https://example.com/image.jpg",
  "videoUrlEn": "https://example.com/video-en.mp4",
  "videoUrlSi": "https://example.com/video-si.mp4"
}
```

### Slide Types
- `"explanation"` - Regular explanatory content
- `"story"` - Story-based content
- `"summary"` - Summary slide
- `"quote"` - Quote slide

### Slide Fields
- **orderIndex** (number, required): Position of slide (1, 2, 3, ...)
- **type** (string, required): One of the slide types above
- **contentEn** (string, required): Content in English
- **contentSi** (string, required): Content in Sinhala
- **imageUrl** (string, optional): URL to image (null if none)
- **videoUrlEn** (string, optional): Video URL in English (null if none)
- **videoUrlSi** (string, optional): Video URL in Sinhala (null if none)

## Question Format

### Single Choice Question

```json
{
  "orderIndex": 1,
  "type": "single_choice",
  "promptEn": "What is Buddhism?",
  "promptSi": "බෞද්ධාගම යනු කුමක්ද?",
  "configJson": {
    "options": {
      "en": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "si": ["විකල්පය 1", "විකල්පය 2", "විකල්පය 3", "විකල්පය 4"]
    },
    "correctIndex": 1
  }
}
```

### Multiple Select Question

```json
{
  "orderIndex": 2,
  "type": "multi_select",
  "promptEn": "Select all that apply:",
  "promptSi": "සියල්ල තෝරන්න:",
  "configJson": {
    "options": {
      "en": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "si": ["විකල්පය 1", "විකල්පය 2", "විකල්පය 3", "විකල්පය 4"]
    },
    "correctIndices": [0, 2]
  }
}
```

### True/False Question

```json
{
  "orderIndex": 3,
  "type": "true_false",
  "promptEn": "Buddhism is a religion.",
  "promptSi": "බෞද්ධාගම ආගමකි.",
  "configJson": {
    "answer": true
  }
}
```

### Question Types
- `"single_choice"` - One correct answer
- `"multi_select"` - Multiple correct answers
- `"true_false"` - True or false
- `"matching"` - Match pairs (advanced)
- `"fill_blank"` - Fill in the blank (advanced)
- `"image_choice"` - Select from images (advanced)

### Question Fields
- **orderIndex** (number, required): Position of question (1, 2, 3, ...)
- **type** (string, required): Question type
- **promptEn** (string, required): Question text in English
- **promptSi** (string, required): Question text in Sinhala
- **configJson** (object, required): Configuration based on question type

## Reflection Format

```json
{
  "reflection": {
    "prompt": {
      "en": "How do you feel about this lesson?",
      "si": "මෙම පාඩම ගැන ඔබට හැඟෙන්නේ කෙසේද?"
    },
    "options": {
      "en": ["Option 1", "Option 2", "Option 3", "Other"],
      "si": ["විකල්පය 1", "විකල්පය 2", "විකල්පය 3", "වෙනත්"]
    }
  }
}
```

## Complete Example for 10 Lessons

See `lesson_data_format_example.json` for a complete example with 2 lessons. You can replicate the structure for all 10 lessons.

## Important Notes

1. **chapterId**: You need to get the actual chapter UUIDs from your database. You can find them by:
   - Running: `cd backend && npx prisma studio` (opens database GUI)
   - Or querying: `SELECT id FROM chapters WHERE "orderIndex" = 1 AND "worldId" = '...'`

2. **Slug**: Must be unique and URL-friendly (lowercase, hyphens, no spaces)

3. **orderIndex**: Must be unique within each chapter (1, 2, 3, ...)

4. **Images/Videos**: Use full URLs or null. For local files, you'll need to upload them first.

5. **Questions**: 
   - `correctIndex` is 0-based for single_choice (0 = first option, 1 = second, etc.)
   - `correctIndices` is an array of 0-based indices for multi_select
   - `answer` is boolean for true_false

## How to Import

You can import lessons via:
1. **Admin Panel** (web interface) - `/admin/lessons`
2. **API Endpoint** - `POST /v1/admin/lessons` (requires admin auth)
3. **Database Script** - Create a custom script similar to `seed.ts`

## Example API Request

```bash
curl -X POST http://localhost:3000/v1/admin/lessons \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d @lesson_data.json
```








