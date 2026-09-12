/**
 * ============================================================
 * FAST INTENT & GREETING BYPASS SERVICE
 * ============================================================
 * Intercepts casual greetings, salutations, and small-talk
 * BEFORE any expensive vector embedding, semantic retrieval, or
 * Gemini LLM API calls are executed.
 * Target Latency: < 50 ms (~5 ms execution).
 */

const GREETING_REGEX = /^(hi|hey|hello|namaste|good (morning|afternoon|evening)|who are you|help)\b/i;

const GREETING_KEYWORDS = [
  'hi', 'hey', 'hello', 'namaste', 'greetings', 'sup',
  'yo', 'help', 'who are you', 'good morning', 'good afternoon', 'good evening'
];

export const STUDENT_GREETING_RESPONSE = 
  "Hello! I am your Polar Science Hub Assistant. Ask me anything about Antarctic expeditions, ocean temperatures, or ice cores!";

export const RESEARCHER_GREETING_RESPONSE = 
  "Welcome to the Polar Science Hub Intelligence Console. Please specify your research query (e.g., ocean hydrography, Dome Fuji paleoclimate, or station logistics).";

/**
 * Fast check for greeting / small-talk intent.
 * 
 * @param {string} text - User question/prompt
 * @param {'student'|'researcher'} mode - Audience persona mode
 * @returns {{ isGreeting: boolean, response: string|null }}
 */
export function detectGreeting(text, mode = 'student') {
  if (!text || typeof text !== 'string') {
    return { isGreeting: false, response: null };
  }

  const clean = text.trim().toLowerCase();

  // Condition 1: Short greeting with fewer than 15 characters matching keyword
  const isShortMatch = clean.length < 15 && GREETING_KEYWORDS.some(kw => clean === kw || clean.startsWith(kw + ' '));

  // Condition 2: Matches regex pattern
  const isRegexMatch = GREETING_REGEX.test(clean);

  if (isShortMatch || isRegexMatch) {
    const isResearcher = (mode && typeof mode === 'string' && mode.trim().toLowerCase() === 'researcher');
    return {
      isGreeting: true,
      response: isResearcher ? RESEARCHER_GREETING_RESPONSE : STUDENT_GREETING_RESPONSE
    };
  }

  return { isGreeting: false, response: null };
}

export default {
  detectGreeting,
  STUDENT_GREETING_RESPONSE,
  RESEARCHER_GREETING_RESPONSE
};
