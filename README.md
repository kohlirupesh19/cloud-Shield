# Cloud Shield

A cloud security and data governance platform with a React frontend, Node.js backend, and Python AI engine.

## Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- PostgreSQL and Redis running locally, or Docker if you want to use the bundled compose setup

## Install

From the project root:

```bash
npm install
cd backend && npm install
cd ../ai-engine && pip install -r requirements.txt
```

## Run the frontend

From the project root:

```bash
npm run dev
```

The frontend runs on `http://localhost:3000`.

## Run the backend

From `backend/`:

```bash
npx prisma generate
npx prisma migrate dev
npm run dev
```

If you want demo data, seed the database first:

```bash
npm run prisma:seed
```

The backend runs on `http://localhost:4000`.

## Run the AI server

From `ai-engine/`:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The AI server runs on `http://localhost:8000`.

## Optional: run everything with Docker

From the project root:

```bash
docker compose up --build
```

This now starts all services and also downloads required Ollama models automatically on first run.

- First run can take several minutes because model downloads are large.
- Ollama models are persisted in a Docker volume (`ollama_data`) so they are not re-downloaded every restart.

## Environment variables

- Frontend: set `VITE_API_URL=http://localhost:4000/api` in `.env.local`
- Backend: configure the database, Redis, JWT, and AI service URLs in `backend/.env`
- AI server: configure `OLLAMA_BASE_URL`, `MODEL_QUALITY`, `MODEL_SECURITY`, `MODEL_GOVERNANCE`, and `MODEL_COMPLIANCE` in `ai-engine/.env`

## Local AI models

Cloud Shield now uses Ollama for local analysis when available.

- Recommended lightweight quantized models: `qwen2.5:3b-instruct-q4_K_M`, `llama3.2:3b-instruct-q4_K_M`, `phi3:mini` (or `phi3.5`)
- Default mappings: quality/compliance/governance use `qwen2.5:3b-instruct-q4_K_M`; security uses `llama3.2:3b-instruct-q4_K_M`
- Start Ollama locally, then pull the models you want:

```bash
ollama pull qwen2.5:3b-instruct-q4_K_M
ollama pull llama3.2:3b-instruct-q4_K_M
ollama pull phi3:mini
```

If Ollama is unavailable, the AI engine falls back to the deterministic analysis already in place.

## Build

Frontend build:

```bash
npm run build
```

Backend build:

```bash
cd backend
npm run build
```
