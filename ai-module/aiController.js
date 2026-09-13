import { geminiClient, getGeminiClient, isApiKeyConfigured } from './geminiClient.js';
import { getEmbedding } from './embeddingService.js';
import { findRelevantContext, FALLBACK_POLAR_CONTEXT } from './retrieverService.js';
import { detectGreeting } from './services/intentService.js';
import {
  generateGroundedAnswer,
  generateRulesEngineFallback,
  buildGroundedPrompt,
  SYSTEM_INSTRUCTION_BASE
} from './services/geminiService.js';

/**
 * Verified polar ground-truth anchors to prevent hallucinations.
 */
export const POLAR_ANCHORS = {
  SOUTHERN_OCEAN_MEAN_TEMP: '-1.571°C',
  SOUTHERN_OCEAN_TEMP_RANGE: '-2.088°C to 1.448°C (Surface to 2,000m depth)',
  SOUTHERN_OCEAN_MEAN_SALINITY: '34.203 PSU (Drives dense Antarctic Bottom Water / AABW formation)',
  DOME_FUJI_RECORD: '720,000 Years BP (Paleoclimate isotope cycles: δ18O and CO2 proxy archives)',
  INDIAN_ANTARCTIC_STATIONS: [
    'Maitri Station (Schirmacher Oasis, Queen Maud Land, operational since 1989, active)',
    'Bharati Station (Larsemann Hills, operational since 2012, active)',
    'Dakshin Gangotri (Queen Maud Land, India\'s first Antarctic base, established 1983, historical station)'
  ]
};

// Configured model request: gemini-2.5-flash with fast active model fallback cached in memory
let activeGenerationModel = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

/**
 * Warm up and verify model selection at server boot time.
 */
export async function warmupModel() {
  if (!isApiKeyConfigured()) return;
  const client = getGeminiClient() || geminiClient;
  const candidates = [process.env.GEMINI_MODEL, 'gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'].filter(Boolean);

  for (const m of candidates) {
    try {
      await client.models.generateContent({
        model: m,
        contents: 'ping',
        config: { maxOutputTokens: 5, temperature: 0.2 }
      });
      activeGenerationModel = m;
      console.log(`⚡ [LLM] Active model verified: ${m}`);
      return;
    } catch (err) {
      // Continue trying next candidate
    }
  }
}

/**
 * Alias to buildGroundedPrompt from geminiService for backward compatibility.
 */
export function buildGroundedSystemPrompt(mode, retrievedChunks = []) {
  return buildGroundedPrompt(mode, retrievedChunks);
}

/**
 * Express Controller: handleAIQuery
 * Optimized Dynamic Semantic RAG Query Handler with Fast Intent Routing,
 * Two-Tier Structural Formatting, and Deterministic Fallback Rules-Engine.
 */
export async function handleAIQuery(req, res) {
  try {
    const { question, query, prompt, mode: rawMode } = req.body || {};
    const effectiveQuestion = question || query || prompt;

    // 1. Validation: question must be present and non-empty
    if (!effectiveQuestion || typeof effectiveQuestion !== 'string' || !effectiveQuestion.trim()) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: question must be a non-empty string."
      });
    }

    const trimmedQuestion = effectiveQuestion.trim();

    // 2. Persona mode normalization (default: 'student')
    const normalizedMode = (typeof rawMode === 'string' && rawMode.trim().toLowerCase() === 'researcher')
      ? 'researcher'
      : 'student';

    // 3. STEP 1 — FAST INTENT & GREETING BYPASS (< 50 ms)
    const greetingCheck = detectGreeting(trimmedQuestion, normalizedMode);
    if (greetingCheck.isGreeting) {
      return res.status(200).json({
        success: true,
        mode: normalizedMode,
        question: trimmedQuestion,
        answer: greetingCheck.response,
        citations: []
      });
    }

    // 4. STEP 2 — Vectorize question using cached/fast text embeddings
    let queryVector = [];
    try {
      queryVector = await getEmbedding(trimmedQuestion);
    } catch (embErr) {
      console.warn('[AIController] Embedding error:', embErr.message);
    }

    // 5. STEP 3 — Semantic retrieval with BM25 candidate filter & 0.45 threshold
    let retrievedCitations = [];
    try {
      retrievedCitations = await findRelevantContext(queryVector, trimmedQuestion, 3);
    } catch (retErr) {
      console.warn('[AIController] Retrieval error:', retErr.message);
    }

    if (!retrievedCitations || retrievedCitations.length === 0) {
      retrievedCitations = FALLBACK_POLAR_CONTEXT;
    }

    // 6. STEP 4 & 5 — Fast Grounded Two-Tier Generation
    let generatedAnswer = '';

    if (!isApiKeyConfigured()) {
      // Fallback rules-engine executes when API key is missing or empty
      generatedAnswer = generateRulesEngineFallback(trimmedQuestion, normalizedMode, retrievedCitations);
    } else {
      try {
        generatedAnswer = await generateGroundedAnswer(trimmedQuestion, normalizedMode, retrievedCitations);
      } catch (genErr) {
        console.warn('[AIController] Generation failed; utilizing rules-engine fallback:', genErr.message);
        generatedAnswer = generateRulesEngineFallback(trimmedQuestion, normalizedMode, retrievedCitations);
      }
    }

    if (!generatedAnswer || !generatedAnswer.trim()) {
      generatedAnswer = generateRulesEngineFallback(trimmedQuestion, normalizedMode, retrievedCitations);
    }

    // 7. Format citations cleanly
    const cleanCitations = retrievedCitations.map(c => ({
      source: c.source,
      page: c.page || 1,
      evidence: c.evidence
    }));

    // 8. Structured JSON response
    return res.status(200).json({
      success: true,
      mode: normalizedMode,
      question: trimmedQuestion,
      answer: generatedAnswer.trim(),
      citations: cleanCitations
    });

  } catch (error) {
    console.error('[AIController Error]:', error?.message || error);

    const statusCode = error?.status || error?.statusCode || 500;
    const errorMessage = error?.message || "An unexpected error occurred while processing the AI query.";

    return res.status(statusCode >= 400 && statusCode < 600 ? statusCode : 500).json({
      success: false,
      error: errorMessage
    });
  }
}

export default handleAIQuery;
