import axios from 'axios';
import { OPENAI_API_KEY } from '../utils/constants';
import { logger } from '../utils/logger';

const OPENAI_API_BASE = 'https://api.openai.com/v1';

export interface KalyanamittaResponse {
  dhamma_explanation: string;
  practical_advice: string;
  short_reflection: string;
  practice_suggestion: {
    show: boolean;
    name: string | null;
    id: string | null;
    reason: string | null;
  };
}

// System prompt for Kalyāṇamitta AI
const SYSTEM_PROMPT = `You are Kalyāṇamitta, a gentle Dhamma companion that provides Buddhist wisdom and practical guidance. You answer user questions with simple, warm, and compassionate responses.

CRITICAL: You MUST ALWAYS respond with valid JSON only, no other text before or after. Your response must match this exact structure:

{
  "dhamma_explanation": "A simple explanation of the Dhamma teaching relevant to the question, in plain language (2-3 sentences)",
  "practical_advice": "Practical, actionable advice the user can apply (2-3 sentences, use bullet points if multiple steps)",
  "short_reflection": "A brief reflection or practice the user can try right now (1-2 sentences)",
  "practice_suggestion": {
    "show": true or false,
    "name": "Practice name" or null,
    "id": "practice_id" or null,
    "reason": "Why this practice helps" or null
  }
}

Practice IDs you can suggest (only if truly relevant):
- "anapanasati" - Mindful Breathing
- "noting" - Noting Practice
- "pause" - Pause Before Reaction
- "sound" - Sound Awareness
- "walking" - Walking Meditation
- "letting_go" - Letting Go Practice
- "thought_bubbles" - Mindful Thought Bubbles
- "body_scan" - Body Scan
- "equanimity" - Equanimity
- "karuna" - Compassion
- "metta" - Loving-Kindness
- "mudita" - Appreciative Joy

Guidelines:
- Keep responses warm, simple, and accessible
- Avoid heavy Pali terms or academic language
- Focus on practical, everyday application
- If no practice is needed, set practice_suggestion.show to false
- Always return valid JSON, nothing else`;

const openaiClient = axios.create({
  baseURL: OPENAI_API_BASE,
  headers: {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 seconds for AI responses
});

// Add response interceptor for debugging
openaiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      logger.error('OpenAI API Error', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      });
    }
    return Promise.reject(error);
  }
);

/**
 * Validates that the response is valid JSON and matches the expected structure
 */
function validateResponse(text: string): KalyanamittaResponse | null {
  try {
    // Try to extract JSON from the response (in case there's extra text)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate structure
    if (
      typeof parsed.dhamma_explanation === 'string' &&
      typeof parsed.practical_advice === 'string' &&
      typeof parsed.short_reflection === 'string' &&
      parsed.practice_suggestion &&
      typeof parsed.practice_suggestion.show === 'boolean'
    ) {
      return {
        dhamma_explanation: parsed.dhamma_explanation,
        practical_advice: parsed.practical_advice,
        short_reflection: parsed.short_reflection,
        practice_suggestion: {
          show: parsed.practice_suggestion.show,
          name: parsed.practice_suggestion.show ? parsed.practice_suggestion.name : null,
          id: parsed.practice_suggestion.show ? parsed.practice_suggestion.id : null,
          reason: parsed.practice_suggestion.show ? parsed.practice_suggestion.reason : null,
        },
      };
    }
    
    return null;
  } catch (error) {
    logger.error('JSON validation error', error);
    return null;
  }
}

/**
 * Calls OpenAI Chat Completions API to get response from Kalyāṇamitta AI
 */
async function getChatCompletion(question: string): Promise<string> {
  try {
    const response = await openaiClient.post('/chat/completions', {
      model: 'gpt-4o-mini', // Using gpt-4o-mini for cost efficiency, can be changed to gpt-4o if needed
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: question,
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }, // Force JSON response
    });

    const content = response.data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI. Please try again.');
    }

    return content;
  } catch (error: any) {
    logger.error('Error getting chat completion', error);
    if (error.response) {
      logger.error('API Error details', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
      });
      
      if (error.response.status === 401) {
        throw new Error('Invalid API key. Please check your configuration.');
      } else if (error.response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
    }
    if (error.message) {
      throw error;
    }
    throw new Error('Failed to get response. Please try again.');
  }
}

/**
 * Sends a question to Kalyāṇamitta AI and returns the structured response
 */
export async function askKalyanamitta(question: string, retryCount = 0): Promise<KalyanamittaResponse> {
  const maxRetries = 2;
  
  try {
    // Get response from Chat Completions API
    const responseText = await getChatCompletion(question);
    
    // Validate and parse JSON
    const validatedResponse = validateResponse(responseText);
    
    if (!validatedResponse) {
      // If invalid JSON and we haven't exceeded retries, try again
      if (retryCount < maxRetries) {
        logger.warn('Invalid JSON response, retrying...', { retryCount, responseText });
        // Add explicit JSON instruction to the question
        const retryQuestion = `${question}\n\nIMPORTANT: Respond with valid JSON only, matching the required structure.`;
        return askKalyanamitta(retryQuestion, retryCount + 1);
      } else {
        throw new Error('The response format was invalid. Please try asking your question again.');
      }
    }
    
    return validatedResponse;
  } catch (error: any) {
    logger.error('Error asking Kalyanamitta', error);
    
    if (error.message) {
      throw error;
    }
    
    throw new Error('Something went wrong. Please try again.');
  }
}

