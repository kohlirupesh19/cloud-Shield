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

Cloud Shield uses **Ollama** exclusively for its LLM-powered features (analysis agents + chat). No cloud LLM dependencies by default.

### Default Models (Docker / compose)

| Task            | Model                              | Notes |
|-----------------|------------------------------------|-------|
| Quality         | `qwen2.5:3b-instruct-q4_K_M`      | 3B quantized |
| Security        | `llama3.2:3b-instruct-q4_K_M`     | 3B quantized |
| Governance      | `qwen2.5:3b-instruct-q4_K_M`      | Same as quality |
| Compliance      | `qwen2.5:3b-instruct-q4_K_M`      | Same as quality |
| Reasoning/Chat  | `phi3:mini`                       | Used by `/ai/chat` (RAG + memory) |

**Embedding** (for compliance RAG / FAISS): `sentence-transformers/all-MiniLM-L6-v2`

The `ollama-pull` sidecar automatically pulls: `qwen2.5:3b-instruct-q4_K_M llama3.2:3b-instruct-q4_K_M phi3:mini`

### Configuration

Override with these environment variables on the `ai-engine` service:

- `MODEL_QUALITY`, `MODEL_SECURITY`, `MODEL_GOVERNANCE`, `MODEL_COMPLIANCE`, `MODEL_REASONING`

You can use any model available in your Ollama instance (e.g. larger models if you have GPU).

The engine exposes the active config at `GET /ai/models` (requires the internal token).

### Fallback

When Ollama is disabled or unavailable, all agents fall back to pure heuristic / statistical methods (no LLM calls). Reports and chat responses correctly indicate `llm_used: false`.

### Local (non-Docker) setup

```bash
ollama pull qwen2.5:3b-instruct-q4_K_M
ollama pull llama3.2:3b-instruct-q4_K_M
ollama pull phi3:mini
```

See the "How to Run" section for pointing the AI engine at your local Ollama.

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

## Features

Cloud-Shield is a production-grade data security, quality, governance and compliance platform. Key capabilities (post Data Flow corrections):

- **Dataset Upload & Hashing**: CSV/JSON upload with automatic SHA256 sourceHash for deduplication and instant re-validation caching.
- **Asynchronous Analysis Pipeline** (core fix): All analyses return 202 immediately + analysisId. Background BullMQ worker (Redis) executes AI calls, transitions QUEUED → RUNNING → COMPLETED/FAILED, creates reports. Upload/validate no longer block the HTTP request.
- **Analysis Types** (real implementations):
  - **Quality**: IsolationForest + pandas heuristics + optional LLM (qwen2.5) for issues/recommendations. Real quality/anomaly scores.
  - **Security**: DBSCAN on access/event logs + LLM for threat patterns/remediations. UEBA style.
  - **Governance**: Policy coverage vs lineage graph validation + LLM.
  - **Compliance**: FAISS RAG over control documents + LLM (retrieves relevant PDPB/GDPR/ISO/SOC2 chunks).
  - **COMBINED**: True parallel fan-out via LangGraph StateGraph (all 4 agents execute concurrently, results aggregated). Replaces the old fake if/elif router.
- **LLM Transparency**: Every agent and report labels `llm_used: true/false`. Falls back gracefully to pure heuristics if Ollama disabled or errors. No more fabricated confidence 0.9 / latency 120.
- **Real Metrics & Reports**:
  - Reports reuse worker-generated markdown.
  - Real confidence/riskScore/status persisted (nulls rendered as N/A).
  - CSV export via `buildReportCsv`.
  - **Real binary PDF** (pdfkit): title, metrics table, markdown body. Generated on demand via `/reports/generate`. Text fallback supported for tests.
  - Storage abstraction (`reportStorage`) — local disk today, S3-ready interface.
- **RAG Chat Assistant** (`/ai/chat`): 
  - Retrieves top controls via existing FAISS `retrieve_controls`.
  - Calls reasoning model with context + LangChain `ConversationBufferMemory` (per-session, persisted).
  - Returns grounded answer + `memory_size` + `llm_used` + context chunks used.
- **Caching**: Content-hash (sourceHash or payload) cache on all analysis endpoints (quality/security/.../workflow). Re-running identical data is sub-second, no AI call.
- **Internal Security**: Backend ↔ AI engine protected by `X-Internal-Token` (unified `AI_INTERNAL_TOKEN` env var). 401 on mismatch.
- **UI Features**: Role-based dashboard (metrics, risk summary, recent activity), dedicated pages for Quality/Security/Governance, Reports list + on-demand generation + downloads, Alerts, Settings. Sample dataset templates for quick testing.
- **Reliability**: Hardened AI client (50s AbortController timeout, 2 retries with backoff on 5xx/network, typed requests/responses). Frontend refresh-token serialized (single in-flight promise, no race).

## How to Run

### Recommended: Docker Compose (full stack, including Ollama model pull)

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api
- AI Engine: http://localhost:8000
- First run downloads Ollama models (several minutes). Models cached in `ollama_data` volume.

Login with seeded demo:
- Email: `admin@cloudshield.local`
- Password: `ChangeMe123!`

Seed more data if needed (inside backend container or locally after `npm run prisma:seed`).

### Local Development (separate terminals)

1. **Prerequisites**
   - Start Postgres + Redis (or use the compose services).
   - Start Ollama locally and pull models:
     ```bash
     ollama pull qwen2.5:3b-instruct-q4_K_M
     ollama pull llama3.2:3b-instruct-q4_K_M
     ollama pull phi3:mini
     ```

2. Backend (from `backend/`):
   ```bash
   npx prisma generate
   npx prisma migrate dev
   npm run prisma:seed   # optional demo org/user/project
   npm run dev
   ```

3. AI Engine (from `ai-engine/`):
   ```bash
   # optionally create .env with OLLAMA_BASE_URL=http://localhost:11434 etc.
   uvicorn app.main:app --reload --port 8000
   ```

4. Frontend (from root):
   ```bash
   npm run dev
   ```

Set `VITE_API_URL=http://localhost:4000/api` if needed.

Environment: `AI_INTERNAL_TOKEN` must match between backend and ai-engine (default is `dev-internal-token-change-me` for local).

## How to Use the Features (Typical Workflow)

1. **Login** at http://localhost:3000 (use demo credentials above).

2. **Upload a Dataset**
   - Go to Data Quality or Dashboard.
   - Upload CSV or JSON (example: `highly_anomalous_dataset.csv` in project root).
   - Upload triggers async QUALITY analysis (202 returned immediately).
   - The UI shows the dataset with initial quality snapshot (scores populated async or on re-validate).

3. **Run Analyses (Async)**
   - From dataset or dedicated pages (DataQuality, SecurityAccess, DataGovernance), trigger individual or COMBINED scan.
   - Response is fast 202 + `analysisId`.
   - Poll `/analysis/:id/status` (or watch in UI) — status moves QUEUED → RUNNING → COMPLETED.
   - On COMPLETED a report is created automatically.
   - COMBINED runs all four agents in true parallel (LangGraph).

4. **View & Export Reports**
   - Go to Reports page.
   - See list of completed analyses.
   - Generate on-demand report if needed (`/reports/generate`).
   - View markdown in UI.
   - Download:
     - CSV (real metrics table)
     - PDF (real binary document with title, metrics table, full report body)
   - Reports distinguish heuristic-only vs LLM-assisted runs.

5. **Use the Intelligent Chat (RAG + Memory)**
   - Open the chat/assistant interface (usually in dashboard or dedicated panel).
   - Ask compliance questions, e.g.:
     - "What are the PDPB data retention requirements?"
     - "Explain access control controls for SOC2"
   - The assistant retrieves relevant chunks from the FAISS compliance corpus, includes conversation history (LangChain buffer), calls the reasoning LLM, and returns a grounded answer.
   - Memory grows per session (`memory_size` increases). Use `/ai/reset` (or UI button) to clear.

6. **Monitor & Govern**
   - Dashboard: overall quality score, open alerts, compliance %, risk distribution.
   - Alerts page: unresolved security events from behavioral analysis.
   - Data Governance page: policy vs lineage checks.
   - Re-validate any dataset: if the file content (sourceHash) is unchanged, the analysis is served from cache (near-instant, no LLM call).

7. **Advanced / Admin**
   - Settings: active frameworks, org config.
   - Admin routes (if role allows): user/org management.
   - Health: `/api/health` and `/ai/health` (the latter requires internal token).

## Tips & Notes

- For full LLM power, ensure Ollama is running and models are pulled. Without it, you still get excellent deterministic + heuristic results (llm_used=false in reports).
- Large uploads are limited by `MAX_UPLOAD_MB` (default 1GB in compose).
- The system is multi-tenant by design (organizationId everywhere).
- All internal AI calls are protected by the token; direct calls to `http://localhost:8000/ai/*` without `X-Internal-Token` return 401.
- Test data: the `highly_anomalous_dataset.csv` is great for seeing high anomaly scores and security alerts.

For development of new features or debugging the async path, the worker logs and analysis status table are your best friends.

Enjoy using Cloud-Shield!
