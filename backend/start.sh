#!/bin/bash
set -e

echo "📦 Installing Python ML dependencies..."
pip install -r ml/requirements.txt

echo "🤖 Starting ML service on port 8000..."
python -m uvicorn ml.main:app --host 0.0.0.0 --port 8000 &

echo "🚀 Starting Node.js backend on port 5000..."
node server.js
