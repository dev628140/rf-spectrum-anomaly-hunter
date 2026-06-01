# Use a slim Python 3.10 image to keep the image lightweight
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set the working directory
WORKDIR /app

# Install system dependencies for scientific libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements.txt and install Python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code, edge runtime, simulation, and models
COPY backend/ /app/backend/
COPY edge/ /app/edge/
COPY simulation/ /app/simulation/
COPY models/ /app/models/

# Create the live_runtime directory for state caching and local persistence
RUN mkdir -p /app/live_runtime

# Expose the API port
EXPOSE 8000

# Set environment variable defaults
ENV RF_MODE=replay
ENV API_PORT=8000
ENV API_HOST=0.0.0.0

# Start the FastAPI server using uvicorn, dynamically binding to the platform PORT or defaulting to 8000
CMD ["sh", "-c", "uvicorn backend.app:app --host 0.0.0.0 --port ${PORT:-8000}"]
