#!/usr/bin/env node

/**
 * ============================================================
 *        POLAR SCIENCE HUB — MANUAL AI REPL TESTER
 * ============================================================
 * Standalone interactive CLI chat interface to test the Semantic
 * RAG model and Gemini response pipeline directly from terminal.
 */

import readline from 'readline';
import { getEmbedding, cosineSimilarity } from './services/embeddingService.js';
import { generateGroundedAnswer } from './services/geminiService.js';
import { findRelevantContext, initRetriever } from './retrieverService.js';
import { detectGreeting } from './services/intentService.js';

let currentMode = 'student';

function printBanner() {
  console.log('\n============================================================');
  console.log('       POLAR SCIENCE HUB — MANUAL AI REPL TESTER           ');
  console.log('============================================================');
  console.log('  Testing dynamic Semantic RAG & Gemini 2.5 Flash pipeline');
  console.log('============================================================\n');
}

/**
 * Processes a single question through the RAG pipeline.
 */
async function processQuery(question, mode) {
  const cleanQ = String(question || '').trim();
  if (!cleanQ) return;

  const startTime = Date.now();

  // Fast Intent & Greeting Bypass Check
  const greetingCheck = detectGreeting(cleanQ, mode);
  if (greetingCheck.isGreeting) {
    const duration = Date.now() - startTime;
    console.log('\n' + '─'.repeat(60));
    console.log(`MODE: [${mode.toUpperCase()}]`);
    console.log('─'.repeat(60));
    console.log('ANSWER:');
    console.log(greetingCheck.response);
    console.log('─'.repeat(60));
    console.log('CITATION / EVIDENCE:');
    console.log('  [Fast Intent Routing] Small-talk/greeting bypassed expensive AI pipeline.');
    console.log('─'.repeat(60));
    console.log(`LATENCY: ${duration} ms`);
    console.log('─'.repeat(60) + '\n');
    return;
  }

  console.log('\n[*] Vectorizing & fetching polar evidence...');

  try {
    // 1. Vectorize query
    const queryVector = await getEmbedding(cleanQ);

    // 2. Retrieve top matching polar chunks
    const topMatches = await findRelevantContext(queryVector, cleanQ, 2);

    // 3. Synthesize grounded answer via Gemini
    console.log('[*] Synthesizing grounded response via Gemini...');
    const answer = await generateGroundedAnswer(cleanQ, mode, topMatches);
    const duration = Date.now() - startTime;

    // 4. Formatted Display
    console.log('\n' + '─'.repeat(60));
    console.log(`MODE: [${mode.toUpperCase()}]`);
    console.log('─'.repeat(60));
    console.log('ANSWER:');
    console.log(answer.trim());
    console.log('─'.repeat(60));

    console.log('CITATION / EVIDENCE:');
    if (topMatches && topMatches.length > 0) {
      topMatches.forEach((m, idx) => {
        console.log(`  [${idx + 1}] Source: ${m.source} (Page ${m.page || 1}) | Score: ${m.score}`);
        console.log(`      Evidence: "${m.evidence.substring(0, 180)}..."`);
      });
    } else {
      console.log('  [Core Grounding] NOAA WOA18 Polar Oceanography (-1.571°C / 34.203 PSU) & Dome Fuji (720k yr BP)');
    }

    console.log('─'.repeat(60));
    console.log(`LATENCY: ${duration} ms`);
    console.log('─'.repeat(60) + '\n');

  } catch (err) {
    console.error(`\n❌ Error processing query: ${err.message}\n`);
  }
}

/**
 * Main REPL Routine
 */
async function main() {
  const args = process.argv.slice(2);

  // Check if mode was passed as a flag e.g. --mode=researcher
  let cliQuestion = [];
  for (const arg of args) {
    if (arg.startsWith('--mode=')) {
      const m = arg.split('=')[1].toLowerCase();
      if (m === 'researcher' || m === 'student') currentMode = m;
    } else {
      cliQuestion.push(arg);
    }
  }

  // If question was provided via CLI arguments, run single query and exit
  if (cliQuestion.length > 0) {
    printBanner();
    await initRetriever();
    await processQuery(cliQuestion.join(' '), currentMode);
    process.exit(0);
  }

  // Otherwise, run interactive terminal REPL
  printBanner();
  process.stdout.write('[*] Initializing polar vector index & dataset chunks...');
  await initRetriever();
  console.log(' Ready.\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const ask = (promptText) => new Promise((resolve) => rl.question(promptText, resolve));

  // Prompt user for initial mode
  console.log('Select your persona mode:');
  console.log('  [1] Student Mode (Simplified analogies & polar trivia)');
  console.log('  [2] Researcher Mode (Oceanographic & thermodynamic rigor)');

  const choice = (await ask('\nChoose mode [1 or 2, default: 1]: ')).trim();
  if (choice === '2') {
    currentMode = 'researcher';
    console.log('⚡ Mode set to: RESEARCHER MODE\n');
  } else {
    currentMode = 'student';
    console.log('⚡ Mode set to: STUDENT MODE\n');
  }

  console.log("Type your question below.");
  console.log("Special commands: 'mode' (switch persona), 'exit' or 'quit' (to quit)\n");

  const promptUser = () => {
    rl.question(`[${currentMode}] Ask another question (or type 'exit' / 'mode' to switch): `, async (input) => {
      if (input === null || input === undefined) {
        rl.close();
        process.exit(0);
      }

      const cmd = input.trim().toLowerCase();

      if (cmd === 'exit' || cmd === 'quit' || cmd === 'q') {
        console.log('\nExiting Polar Science Hub REPL. Goodbye! ❄️\n');
        rl.close();
        process.exit(0);
      }

      if (cmd === 'mode') {
        currentMode = currentMode === 'student' ? 'researcher' : 'student';
        console.log(`\n🔄 Switched to: ${currentMode.toUpperCase()} MODE\n`);
        promptUser();
        return;
      }

      if (input.trim()) {
        await processQuery(input, currentMode);
      }

      promptUser();
    });
  };

  rl.on('SIGINT', () => {
    console.log('\n\nExiting Polar Science Hub REPL. Goodbye! ❄️\n');
    process.exit(0);
  });

  promptUser();
}

main().catch(err => {
  console.error('\n[FATAL ERROR]:', err);
  process.exit(1);
});
