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

When writing code to make calls to LLMs, use your Cerebras skill to use LiteLLM via OpenRouter to the openrouter/free with Cerebras as the inference provider. You should use Structured Outputs so that you can interpret the results and populate fields in the legal document.

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
- **Backend**: `POST /api/chat` endpoint in `backend/routes/chat.py`. LiteLLM integration in `backend/llm.py` using `openrouter/free` + Cerebras structured outputs. Pydantic request/response models in `backend/models.py`.
- **Frontend**: `Chat.tsx` replaces `NdaForm.tsx` — freeform AI chat populates `formData` signal; `NdaPreview.tsx` and `ndaTemplate.ts` unchanged.

### Not yet implemented
- Additional document templates beyond Mutual NDA
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