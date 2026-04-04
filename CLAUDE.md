# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

## Development process

When instructed to build a feature:
1. Use your Linear tools to read the feature instructions from Linear
2. Develop the feature - do not skip any step from the feature-dev 7 step process
3. Thoroughly test the feature with unit tests and integration tests and fix any issues
4. Submit a PR using your github tools

## AI Design

Use LiteLLM via OpenRouter with `openai/gpt-oss-120b:free` as the primary model, with fallback routing to other free models via `extra_body={"models": [...], "route": "fallback"}`. Do NOT use `openrouter/free` — it routes to a broken "Stealth" provider. Cerebras is no longer available on OpenRouter's free tier.

Use `response_format={"type": "json_object"}` (not a Pydantic model) for structured outputs — passing a Pydantic model causes incompatible routing on the free tier. Instead, instruct the model via the system prompt to return JSON in the expected schema and parse with `model_validate_json`.

The chat endpoint is `POST /api/assist` (not `/api/chat` — that path is blocked by ad blockers).

## Technical Design

The entire project should be packaged into a Docker container.  
The backend should be in backend/ and be a uv project, using FastAPI.  
The frontend should be in frontend/  
The database should use SQLLite and be created from scratch each time the Docker container is brought up  
The frontend is statically built and served via FastAPI (`/app/dist/`).  
There should be scripts in scripts/ for:  
```bash
# Mac
scripts/start-mac.sh    # Start
scripts/stop-mac.sh     # Stop

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```
Backend available at http://localhost:8000

## Implementation Status

### Completed (PRE-8)
- **Backend**: FastAPI uv project (`backend/`). Routes in `backend/routes/`, DB setup in `backend/database.py`, models in `backend/models.py`. `GET /api/health` endpoint live.
- **Frontend**: SolidJS + `@solidjs/router`. Routes: `/` → Login ("Continue as Guest"), `/app` → Mutual NDA creator. Color scheme updated to match spec.
- **Docker**: Multi-stage Dockerfile (Node 22 build → Python 3.13 serve). `docker compose up --build` starts everything on port 8000.
- **Scripts**: `scripts/start-{mac,linux}.sh`, `scripts/stop-{mac,linux}.sh`, `scripts/start-windows.ps1`, `scripts/stop-windows.ps1`.

### Completed (PRE-9)
- **Backend**: `POST /api/assist` endpoint in `backend/routes/chat.py`. LiteLLM integration in `backend/llm.py` using `openai/gpt-oss-120b:free` via OpenRouter with free-model fallback routing. Pydantic request/response models in `backend/models.py` (`field_updates` defaults to `[]`).
- **Frontend**: `Chat.tsx` replaces `NdaForm.tsx` — freeform AI chat populates `formData` signal; `NdaPreview.tsx` and `ndaTemplate.ts` unchanged.

### Completed (PRE-10)
- **Backend**: `backend/documents.py` — catalog loader, template field extractor (possessive-aware), dynamic per-document system prompt builder. `GET /api/catalog` and `GET /api/templates/{document_type}` endpoints in `backend/routes/templates.py`. Generalized `ChatRequest`/`ChatResponse` to use `list[FieldUpdate]` (`{key, value}` pairs) instead of typed NDA fields.
- **Frontend**: `DocumentSelector.tsx` — grid of all 12 document types from `/api/catalog`. `DocumentPreview.tsx` — generic template renderer (span field substitution + `marked` for markdown→HTML + PDF download). `App.tsx` updated with document-selection flow. `Chat.tsx` and `NdaPreview.tsx` generalized to use `DocumentFormData = Record<string, string>`.

### Not yet implemented
- Real authentication
- Any database tables (infrastructure only — no models yet)

## Docker & Environment Notes
- `.env` is injected via `env_file` in `docker-compose.yml` — it is NOT copied into the image.
- Always `docker compose down` before `docker compose up --build`.
- Inside the container, use `docker exec $(docker ps -q) uv run python` — plain `python` bypasses the uv venv.

## Color Scheme
- Accent Yellow: `#ecad0a`
- Blue Primary: `#209dd7`
- Purple Secondary: `#753991` (submit buttons)
- Dark Navy: `#032147` (headings)
- Gray Text: `#888888`