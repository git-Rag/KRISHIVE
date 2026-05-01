# KRISHIVE
Offline-first, voice-first AI Farming Assistant for Smart, Accessible Agriculture

## Overview
KRISHIVE is a **government-grade, mobile-first** AI farming assistant built for Indian farmers.
It delivers **fast, simple, actionable guidance** with **voice input**, **bilingual UI (English/Hindi)**, and **offline-friendly** UX.

## Features
- **Single-page, scroll-based homepage** (not a dashboard)
- **Voice-first AI assistant** (speech-to-text + Groq responses)
- **Bilingual UI (English / Hindi)** with persisted language toggle
- **Location-aware context**
  - One-click “Use My Location” (GPS with IP fallback)
  - Cached to `localStorage` + offline fallback
- **Water Intelligence Engine (JalSetu integration)**
  - `/water-advice` endpoint + `/water-advice` page
  - Water/irrigation keyword routing inside `/voice-query`
- **Disease Detection (Groq Vision)**
  - Drag/drop image upload + AI diagnosis + treatment steps
- **Fertilizer Suggestions**
  - Refactored to **auto-recommend from crop selection** (minimal input)
- **PWA-ready**
  - `next-pwa` enabled for production builds (offline caching)

## Problem Statement
Farmers often lack access to real-time, reliable agricultural guidance. Existing tools depend heavily on internet connectivity and are not optimized for local use cases.

## Solution
KRISHIVE provides a lightweight, multilingual assistant that works in low-connectivity areas and supports fast decision-making with:
- voice-based queries
- location-aware weather context
- modular domain engines (water advice, fertilizer guidance, disease detection)

## Tech Stack
- **Frontend**: Next.js (App Router) + React + TypeScript + Tailwind
- **Backend**: FastAPI + Requests
- **AI**: Groq Chat Completions API (text + vision)
- **PWA**: `@ducanh2912/next-pwa`

## Project Structure
```
.
├── frontend/
├── backend/
├── .gitignore
└── README.md
```

## Setup Instructions

### Backend
1. Go to `backend/`
2. (Optional) Create and activate a virtual environment
3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Create `backend/.env` from `backend/.env.example`
5. Run the API:

```bash
python -m uvicorn main:app --reload
```

### Frontend
1. Go to `frontend/`
2. Install dependencies:

```bash
npm install
```

3. Run dev server:

```bash
npm run dev
```

## Environment Variables
Create `backend/.env` using `backend/.env.example`.

Required:
- **`GROQ_API_KEY`**: Groq API key

Optional (recommended):
- **`OPENWEATHER_API_KEY`**: used by `POST /weather-by-location`
- **`GROQ_VISION_MODEL`**: vision-capable model id (default: `meta-llama/llama-4-scout-17b-16e-instruct`)
- **`GROQ_VISION_FALLBACK_MODEL`**: optional fallback model id
- **`FRONTEND_ORIGIN`**: CORS origin (default `*` if unset)

Frontend env:
- **`NEXT_PUBLIC_API_URL`** (optional): defaults to `http://localhost:8000`

## Key Routes

### Frontend pages
- `/` Home (AI input + sections)
- `/water-advice` Water Advice (location + auto weather + crop/soil + result)
- `/disease-detection` Disease Detection (image upload + Groq Vision)
- `/fertilizer` Fertilizer Suggestions (crop → automatic recommendation)

### Backend endpoints (FastAPI)
- `POST /voice-query` Voice/text query → Groq (routes irrigation queries to water engine)
- `POST /water-advice` Water engine advice
- `POST /weather-by-location` OpenWeather snapshot by lat/lon
- `POST /api/detect-disease` Groq Vision disease detection (multipart upload)
- `POST /api/fertilizer-suggestion` Groq JSON fertilizer plan
- `GET /health` service status

## Notes
- **Offline fallback**: last known location and key UI sections remain usable; weather fetch requires internet.
- **Performance**: no heavy UI libraries; minimal animations; mobile-first layout.

## License
This project is for educational and hackathon purposes.

## Project Info

This project was developed and presented at the Oriental Techhack 2.0 Hackathon.

---
