# SIH 2026: Plug-and-Play Polar AI Microservice (`ai-module`)

An independent, zero-hallucination AI microservice built with **Node.js, Express, and the official Google Gen AI SDK (`@google/genai`)** using `gemini-2.5-flash`.

This module runs completely isolated on **Port 5001** for standalone testing, and is designed so teammates can drop it into any existing Express backend by copying only **2 files** (`geminiClient.js` and `aiController.js`) with zero merge conflicts.

---

## ❄️ Key Features & Grounding Guarantees

1. **Zero Hallucination Anchors**:
   Strict factual polar metrics are anchored directly in the system prompt to eliminate model fabrication:
   - **Southern Ocean Mean Temperature**: `-1.571°C` (Surface to 2,000m range: `-2.088°C` to `1.448°C`)
   - **Southern Ocean Mean Salinity**: `34.203 PSU` (Drives dense Antarctic Bottom Water / AABW formation)
   - **Dome Fuji Ice Core Archive**: `720,000 Years BP` paleoclimate isotope cycles ($\delta^{18}\text{O}$, $\text{CO}_2$)
   - **Active Indian Antarctic Stations**: `Maitri` (Schirmacher Oasis) and `Bharati` (Larsemann Hills)

2. **Adaptive Dual-Persona Tone**:
   - `'student'` (default): Explains complex concepts using intuitive analogies, simple English, and relatable polar trivia.
   - `'researcher'`: Employs academic oceanographic, thermodynamic, and isotopic terminology with rigorous scientific depth.

3. **Standardized Verifiable Output**:
   Every response includes structured citations matching verified sources (NOAA WOA18 and Dome Fuji Ice Core Archive).

---

## 📁 File Structure

```
ai-module/
├── package.json          # Node dependencies (@google/genai, express, cors, dotenv)
├── .env                  # Environment configuration (PORT=5001, GEMINI_API_KEY)
├── .env.example          # Template configuration
├── geminiClient.js       # [PORTABLE 1] Initialized GoogleGenAI client singleton
├── aiController.js       # [PORTABLE 2] Core controller with grounding & personas
├── server.js             # Standalone test runner (Port 5001)
├── test-query.mjs        # Automated verification test script
└── README.md             # Documentation & drop-in guide
```

---

## 🚀 Standalone Quickstart (Port 5001)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Add your Google Gemini API key to `.env`:
```env
PORT=5001
GEMINI_API_KEY="your-gemini-api-key-here"
```
*(Get a key from [Google AI Studio](https://aistudio.google.com/))*

### 3. Start the Microservice
```bash
npm start
```
The server will boot on `http://localhost:5001`.

### 4. Run Automated Tests
```bash
npm test
```

---

## 📡 API Endpoints

### 1. Health Check
- **Route**: `GET /health`
- **Response**:
```json
{
  "status": "healthy",
  "service": "SIH 2026 Polar AI Microservice",
  "port": 5001,
  "geminiKeyConfigured": true,
  "timestamp": "2026-09-11T00:40:00.000Z"
}
```

### 2. AI Query
- **Route**: `POST /api/query` (or alias `POST /api/ai/query`)
- **Request Body**:
```json
{
  "question": "How does salinity drive ocean circulation around Antarctica?",
  "mode": "student"
}
```
*(Options for `mode`: `"student"` or `"researcher"`. Defaults to `"student"` if omitted).*

- **Successful Response (200 OK)**:
```json
{
  "success": true,
  "mode": "student",
  "question": "How does salinity drive ocean circulation around Antarctica?",
  "answer": "Think of the Southern Ocean like a giant, super-chilled conveyor belt...",
  "citations": [
    {
      "source": "NOAA WOA18 Polar Oceanography",
      "verifiedMetric": "-1.571°C / 34.203 PSU"
    },
    {
      "source": "Dome Fuji Ice Core Archive",
      "verifiedMetric": "720,000 Years BP"
    }
  ]
}
```

- **Validation Error (400 Bad Request)**:
```json
{
  "success": false,
  "error": "Missing required field: 'question' must be a non-empty string."
}
```

---

## 🤝 2-File Drop-In Guide for Teammates

To integrate this AI module into your teammate's existing Express backend:

### Step 1: Copy 2 Files
Copy only these 2 files into your teammate's backend directory:
- `geminiClient.js`
- `aiController.js`

### Step 2: Install the Gemini SDK
In their project root, run:
```bash
npm install @google/genai dotenv
```

### Step 3: Mount the Route in their `server.js` or `app.js`
Add just 2 lines to their Express app:
```javascript
import { handleAIQuery } from './aiController.js';

// Register endpoint
app.post('/api/ai/query', handleAIQuery);
```

Ensure their `.env` has `GEMINI_API_KEY="your_api_key"`. Done! Zero merge conflicts.
