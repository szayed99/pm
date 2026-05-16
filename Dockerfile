FROM node:22-bookworm-slim AS frontend-build

WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

WORKDIR /app

COPY backend/pyproject.toml backend/uv.lock ./
COPY backend/pm_backend ./pm_backend
RUN uv sync --frozen --no-dev

COPY --from=frontend-build /frontend/out ./static

ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8000

CMD ["uvicorn", "pm_backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
