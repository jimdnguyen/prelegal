# Stage 1: Build SolidJS frontend
FROM node:22-alpine AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: FastAPI backend + static frontend
FROM python:3.13-slim
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
RUN pip install uv --no-cache-dir

WORKDIR /app

# Install Python deps (cached layer)
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev

# Copy backend source
COPY backend/ ./

# Copy catalog and templates (needed by documents.py)
COPY catalog.json ./
COPY templates/ ./templates/

# Copy built frontend
COPY --from=frontend-build /app/dist ./dist

RUN chown -R 1000:1000 /app
USER 1000

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/api/health || exit 1
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
