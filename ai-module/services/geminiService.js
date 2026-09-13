import { geminiClient, getGeminiClient, isApiKeyConfigured } from '../geminiClient.js';
import { POLAR_ANCHORS } from '../aiController.js';
import { FALLBACK_POLAR_CONTEXT } from '../retrieverService.js';

// Primary requested model is gemini-2.0-flash with fast active model fallback cached in memory
let activeGenerationModel = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

/**
 * STRICT SYSTEM INSTRUCTION CONTRACT — 3-STATION POINT-VIEW ARCHITECTURE
 */
export const SYSTEM_INSTRUCTION_BASE = `You are the Polar Science Hub Intelligence Specialist.

STATION COMPLETENESS RULE:

When answering a query about Indian Antarctic research stations, station
history, station-wise research, station activities, or station comparison,
you MUST cover all three Indian Antarctic stations:

1. Maitri Station
2. Bharati Station
3. Dakshin Gangotri

Maitri and Bharati are active stations.

Dakshin Gangotri is India's first historical/former Antarctic station.

Never omit Dakshin Gangotri because it is historical or no longer active.

RESPONSE STRUCTURE:

Begin with a concise narrative overview.

Then provide the stations in this exact order:

* **Maitri Station:** ...
** research area
** research area

* **Bharati Station:** ...
** research area
** research area

* **Dakshin Gangotri:** ...
** research area
** research area

RESEARCH FORMATTING RULE:

Never combine multiple scientific disciplines, research areas, activities,
or operational scopes into a comma-separated sentence.

Every individual research item MUST be placed on its own line beginning with:

** 

Never use:

'A, B, C, and D'

when A, B, C, and D are separate research items.

Instead use:

** A
** B
** C
** D

GROUNDING RULE:

Only use information supported by the retrieved repository evidence or
verified project baselines.

Never invent station activities, coordinates, dates, operational status,
researchers, projects, expeditions, publications, or datasets.

If evidence for a specific item is unavailable, explicitly state that the
information is not available in the current repository evidence.`;

/**
 * Constructs the complete grounded prompt combining:
 * System Instruction + Injected RAG Context Chunks + Verified Polar Anchors + Persona Scope.
 *
 * @param {'student'|'researcher'} mode
 * @param {Array<{source: string, page: number, evidence: string}>} retrievedEvidence
 * @returns {string}
 */
export function buildGroundedPrompt(mode = 'student', retrievedEvidence = []) {
  const evidenceList = (retrievedEvidence && retrievedEvidence.length > 0)
    ? retrievedEvidence
    : (FALLBACK_POLAR_CONTEXT || []);

  const evidenceBlock = evidenceList.map((chunk, index) => 
    `[RECORD ${index + 1}] Source: "${chunk.source}" | Page: ${chunk.page || 1}\nEvidence: ${chunk.evidence}`
  ).join('\n\n');

  return `${SYSTEM_INSTRUCTION_BASE}

================================================================================
DYNAMIC RETRIEVED POLAR EVIDENCE (SEMANTIC RAG CONTEXT)
================================================================================
${evidenceBlock}

================================================================================
CORE GROUND-TRUTH POLAR BASELINES
================================================================================
- Southern Ocean Mean Temperature: ${POLAR_ANCHORS?.SOUTHERN_OCEAN_MEAN_TEMP || '-1.571°C'} (Vertical range: ${POLAR_ANCHORS?.SOUTHERN_OCEAN_TEMP_RANGE || '-2.088°C to 1.448°C'}).
- Southern Ocean Mean Salinity: ${POLAR_ANCHORS?.SOUTHERN_OCEAN_MEAN_SALINITY || '34.203 PSU'}.
- Dome Fuji Ice Core Record: ${POLAR_ANCHORS?.DOME_FUJI_RECORD || '720,000 Years BP'}.
- Indian Antarctic Stations: ${(POLAR_ANCHORS?.INDIAN_ANTARCTIC_STATIONS || [
    'Maitri Station (Schirmacher Oasis, Queen Maud Land, established in 1989, active)',
    'Bharati Station (Larsemann Hills, established in 2012, active)',
    'Dakshin Gangotri (Queen Maud Land, established in 1983, India\'s first historical station)'
  ]).join('; ')}.

Persona Scope: ${mode === 'researcher' ? 'Academic oceanographic, cryospheric, and paleoclimate depth.' : 'Engaging, direct, and accessible polar science outreach.'}`;
}

/**
 * Deterministic Rules-Engine Fallback:
 * Produces strictly compliant multi-tier responses:
 * 1. Executive overview (2-3 sentences)
 * 2. Main station points (* **Station:**)
 * 3. Scientific sub-bullets (** discipline)
 *
 * @param {string} question
 * @param {'student'|'researcher'} mode
 * @param {Array<{source: string, page: number, evidence: string}>} retrievedEvidence
 * @returns {string}
 */
export function generateRulesEngineFallback(question, mode = 'student', retrievedEvidence = []) {
  const lowerQ = (question || '').toLowerCase();

  // 1. Topic: Indian Antarctic Research Stations (Maitri, Bharati, Dakshin Gangotri)
  if (lowerQ.includes('station') || lowerQ.includes('maitri') || lowerQ.includes('bharati') || lowerQ.includes('dakshin') || lowerQ.includes('gangotri') || lowerQ.includes('antarctic') || lowerQ.includes('polar')) {
    const overview = `India maintains a significant scientific presence in Antarctica through three key research stations established under its national polar programme. While Dakshin Gangotri was India's pioneering base, Maitri and Bharati currently serve as the two permanent, year-round operational hubs supporting multidisciplinary polar investigations.`;

    const maitriSection = [
      `* **Maitri Station:** Located in the Schirmacher Oasis of Queen Maud Land and operational continuously since 1989 near freshwater Lake Priyadarshini.`,
      `** earth sciences`,
      `** meteorology`,
      `** glaciology`,
      `** environmental studies`
    ].join('\n');

    const bharatiSection = [
      `* **Bharati Station:** Located in the Larsemann Hills and operational since 2012 to support marine and coastal Antarctic investigations.`,
      `** oceanography`,
      `** geological studies`,
      `** coastal research`,
      `** marine ecosystems`
    ].join('\n');

    const dgSection = [
      `* **Dakshin Gangotri:** Established in 1983 in Queen Maud Land as India's first Antarctic base and now a historical/former station.`,
      `** baseline meteorological observations`,
      `** early glaciological profiling`,
      `** geomagnetism studies`,
      `** polar survival and structural logistics`
    ].join('\n');

    return `${overview}\n\n${maitriSection}\n\n${bharatiSection}\n\n${dgSection}`;
  }

  // 2. Topic: Oceanography / Salinity / Temperature / Antarctic Bottom Water (AABW)
  if (lowerQ.includes('salinity') || lowerQ.includes('temperature') || lowerQ.includes('ocean') || lowerQ.includes('aabw') || lowerQ.includes('water')) {
    const overview = `Southern Ocean hydrography is governed by extreme thermal and haline density gradients that drive global thermohaline circulation. Dense Antarctic Bottom Water (AABW) formation represents the primary oceanographic mechanism ventilating the global abyssal basins.`;

    const oceanSection = [
      `* **Hydrographic Baselines:** Regional oceanographic parameters anchored by decadal climatology.`,
      `** Southern Ocean mean water temperature of -1.571°C across the water column`,
      `** regional salinity profiling baseline of 34.203 PSU governing static stability`,
      `** brine rejection elevating salinity above 34.6 PSU at -1.85°C to -1.9°C to trigger AABW cascades`
    ].join('\n');

    return `${overview}\n\n${oceanSection}`;
  }

  // 3. Topic: Paleoclimate / Ice Cores / Dome Fuji
  if (lowerQ.includes('dome fuji') || lowerQ.includes('ice core') || lowerQ.includes('climate') || lowerQ.includes('720,000')) {
    const overview = `Polar ice core archives preserve high-resolution records of Earth's paleo-atmosphere, climatic fluctuations, and greenhouse gas cycles over multiple glacial epochs. The deep core recovered from Dome Fuji provides an empirical reference benchmark for understanding planetary climate cycles.`;

    const iceSection = [
      `* **Dome Fuji Ice Core Archive:** High-resolution paleoclimate records preserved in East Antarctica.`,
      `** deep ice core continuous chronology spanning 720,000 years BP across eight glacial cycles`,
      `** isotopic thermometry profiling atmospheric temperature oscillations`,
      `** greenhouse gas concentration measurements in trapped fossil air bubbles`
    ].join('\n');

    return `${overview}\n\n${iceSection}`;
  }

  // 4. Default Fallback
  const overview = `Polar science investigations conducted under the Indian Antarctic Program integrate continuous high-latitude observations across three key stations to monitor global environmental dynamics.`;

  const defaultSection = [
    `* **Maitri Station:** Located in Schirmacher Oasis and established in 1989 as a permanent base.`,
    `** meteorology and atmospheric studies`,
    `** glaciological monitoring of surrounding ice shelves`,
    `* **Bharati Station:** Located in Larsemann Hills and operational since 2012 for oceanographic research.`,
    `** oceanography and coastal marine observations`,
    `** satellite tracking and upper atmosphere physics`,
    `* **Dakshin Gangotri:** Established in 1983 as India's first Antarctic base, now preserved as a historical site.`,
    `** baseline meteorological observations`,
    `** polar glaciology and logistics testing`
  ].join('\n');

  return `${overview}\n\n${defaultSection}`;
}

/**
 * Sanitizes model output to ensure strictly compliant hierarchy and '** ' formatting.
 * Preserves main points ('* **[Entity]:**') while formatting all sub-bullets to start with '** '.
 */
export function sanitizeBulletOutput(text) {
  if (!text || typeof text !== 'string') return '';
  let cleaned = text
    .replace(/^\[PART\s*1[^\]]*\]\s*/i, '')
    .replace(/\n\[PART\s*2[^\]]*\]\s*/i, '\n')
    .replace(/^\[PART\s*2[^\]]*\]\s*/i, '')
    .trim();

  const lines = cleaned.split('\n');
  const normalizedLines = lines.map(line => {
    const trimmed = line.trim();

    // Case 1: Main point heading with bold title and colon (e.g. '* **Maitri Station:** ...' or '* **Dakshin Gangotri:** ...')
    // Must be preserved and formatted as:
    // '* **Maitri Station:**'
    // '* **Bharati Station:**'
    // '* **Dakshin Gangotri:**'
    if (/^(?:\*|-|\d+\.)\s+\*\*[^*]+:\*\*/.test(trimmed)) {
      let heading = trimmed;
      if (/^(?:\*|-|\d+\.)\s+\*\*Dakshin Gangotri(?: Station)?:\*\*/i.test(heading)) {
        heading = heading.replace(/^(?:\*|-|\d+\.)\s+\*\*Dakshin Gangotri(?: Station)?:\*\*/i, '* **Dakshin Gangotri:**');
      } else if (/^(?:\*|-|\d+\.)\s+\*\*Maitri(?: Station)?:\*\*/i.test(heading)) {
        heading = heading.replace(/^(?:\*|-|\d+\.)\s+\*\*Maitri(?: Station)?:\*\*/i, '* **Maitri Station:**');
      } else if (/^(?:\*|-|\d+\.)\s+\*\*Bharati(?: Station)?:\*\*/i.test(heading)) {
        heading = heading.replace(/^(?:\*|-|\d+\.)\s+\*\*Bharati(?: Station)?:\*\*/i, '* **Bharati Station:**');
      } else if (/^\*\s+\*\*\[([A-Za-z0-9\s]+)\]:\*\*/.test(heading)) {
        heading = heading.replace(/^\*\s+\*\*\[([A-Za-z0-9\s]+)\]:\*\*/, (m, name) => {
          const cleanName = name.trim();
          return `* **${cleanName}:**`;
        });
      }
      return heading;
    }

    if (/^\*\*\s*(Maitri|Bharati)\s+Station:\*\*/i.test(trimmed)) {
      return trimmed.replace(/^\*\*\s*(Maitri|Bharati)\s+Station:\*\*/i, '* **$1 Station:**');
    }
    if (/^\*\*\s*Dakshin Gangotri(?: Station)?:\*\*/i.test(trimmed)) {
      return trimmed.replace(/^\*\*\s*Dakshin Gangotri(?: Station)?:\*\*/i, '* **Dakshin Gangotri:**');
    }

    // Case 2: Line already starts with '** '
    if (trimmed.startsWith('** ')) {
      return trimmed;
    }

    // Case 3: Sub-bullet starting with '* ** ' where there is NO colon (sub-discipline bullet)
    if (/^[*-]\s+\*\*\s+/.test(trimmed)) {
      return trimmed.replace(/^[*-]\s+\*\*\s+/, '** ');
    }

    // Case 4: Standard Markdown bullet '* ' or '- ' under a station heading
    if (/^[*-]\s+/.test(trimmed)) {
      return trimmed.replace(/^[*-]\s+/, '** ');
    }

    return line;
  });

  return normalizedLines.join('\n').trim();
}

/**
 * Generates grounded answer using Google Gemini strictly enforcing:
 * 1. maxOutputTokens: 650
 * 2. temperature: 0.2
 * 3. Final user prompt directive with Overview + Main Station Points + '** ' Sub-Bullets
 *
 * @param {string} question 
 * @param {'student'|'researcher'} mode 
 * @param {Array<{source: string, page: number, evidence: string}>} retrievedEvidence 
 * @returns {Promise<string>}
 */
export async function generateGroundedAnswer(question, mode = 'student', retrievedEvidence = []) {
  if (!isApiKeyConfigured()) {
    console.warn('[GeminiService] API key not configured. Using rules-engine fallback.');
    return generateRulesEngineFallback(question, mode, retrievedEvidence);
  }

  const client = getGeminiClient() || geminiClient;
  const systemPrompt = buildGroundedPrompt(mode, retrievedEvidence);

  // Exact prompt instruction appended at the final stage of prompt assembly
  const finalPromptInstruction = "Station Coverage Reminder: If this is a query about Indian Antarctic research stations, include ALL THREE stations: Maitri, Bharati, and Dakshin Gangotri. Present them in that order. Give each station a brief location and operational/historical summary, followed by individual research sub-bullets. Every research item MUST be on its own line starting with '** '. Never combine multiple research areas using commas or conjunctions.";
  const promptContents = `${question.trim()}\n\n${finalPromptInstruction}`;

  const generationConfig = {
    systemInstruction: systemPrompt,
    maxOutputTokens: 650,
    temperature: 0.2
  };

  try {
    const response = await client.models.generateContent({
      model: activeGenerationModel,
      contents: promptContents,
      config: generationConfig
    });

    const answer = response?.text;
    if (answer && answer.trim()) {
      return sanitizeBulletOutput(answer);
    }
    return generateRulesEngineFallback(question, mode, retrievedEvidence);
  } catch (modelErr) {
    const isNotFound = modelErr?.status === 404 || modelErr?.message?.includes('404') || modelErr?.message?.includes('not found') || modelErr?.message?.includes('no longer available');
    
    if (isNotFound || activeGenerationModel === 'gemini-2.0-flash') {
      // Graceful fallback to verified available model
      activeGenerationModel = 'gemini-1.5-flash';
      try {
        const fallbackResponse = await client.models.generateContent({
          model: activeGenerationModel,
          contents: promptContents,
          config: generationConfig
        });
        if (fallbackResponse?.text && fallbackResponse.text.trim()) {
          return sanitizeBulletOutput(fallbackResponse.text);
        }
      } catch (innerErr) {
        console.warn('[GeminiService] Model fallback failed:', innerErr.message);
      }
    }

    console.warn('[GeminiService] Generation failed, engaging rules-engine fallback:', modelErr.message);
    return generateRulesEngineFallback(question, mode, retrievedEvidence);
  }
}

export default {
  generateGroundedAnswer,
  buildGroundedPrompt,
  generateRulesEngineFallback,
  SYSTEM_INSTRUCTION_BASE,
  sanitizeBulletOutput
};
