import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from module .env then cwd .env
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

/**
 * Normalizes the API key by trimming and removing any wrapping quotes.
 */
function cleanApiKey(key) {
  if (!key) return '';
  return key.replace(/#.*$/, '').trim().replace(/^["']|["']$/g, '');
}

const rawApiKey = cleanApiKey(process.env.GEMINI_API_KEY);

/**
 * Initialized default GoogleGenAI client instance with zero-delay failover
 */
export const geminiClient = new GoogleGenAI({
  apiKey: rawApiKey,
  httpOptions: {
    retryOptions: { attempts: 1 }
  }
});

/**
 * Returns a GoogleGenAI client using the latest environment key.
 */
export function getGeminiClient() {
  const currentKey = cleanApiKey(process.env.GEMINI_API_KEY);
  return new GoogleGenAI({
    apiKey: currentKey,
    httpOptions: {
      retryOptions: { attempts: 1 }
    }
  });
}

/**
 * Runtime helper to verify if a valid API key is present
 */
export function isApiKeyConfigured() {
  const currentKey = cleanApiKey(process.env.GEMINI_API_KEY);
  return Boolean(currentKey && currentKey.length > 5);
}

export default geminiClient;
