# syntax=docker/dockerfile:1.7
FROM python:3.11-slim

# Install uv by copying it directly from the official image (extremely fast: <0.1s)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

COPY requirements.txt ./

ENV PIP_DISABLE_PIP_VERSION_CHECK=1 \
	PIP_NO_CACHE_DIR=0

# Install CPU-only version of torch first, then install requirements using uv with a persistent cache mount
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install --system --extra-index-url https://download.pytorch.org/whl/cpu torch && \
    uv pip install --system -r requirements.txt

COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
