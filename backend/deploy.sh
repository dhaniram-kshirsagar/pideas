#!/bin/bash
# Deployment script for Project Idea Generator Python Backend to Firebase/Cloud Run

set -e

echo "🚀 Deploying Project Idea Generator Python Backend"
echo "=================================================="

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI not found. Please install it first:"
    echo "   https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is logged in
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Not logged in to Google Cloud. Please run:"
    echo "   gcloud auth login"
    exit 1
fi

# Get current project
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ No Google Cloud project set. Please run:"
    echo "   gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "📋 Project ID: $PROJECT_ID"

# Enable required APIs
echo "🔧 Enabling required Google Cloud APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please create it from .env.example"
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env | xargs)

# Validate required environment variables
if [ -z "$GEMINI_API_KEY" ]; then
    echo "❌ GEMINI_API_KEY not set in .env file"
    exit 1
fi

# Create secret for Gemini API key
echo "🔐 Creating secret for Gemini API key..."
echo -n "$GEMINI_API_KEY" | gcloud secrets create gemini-api-key --data-file=- --replication-policy="automatic" || true

# Deploy using Cloud Build
echo "🏗️  Building and deploying to Cloud Run..."
gcloud builds submit --config cloudbuild.yaml .

# Get the service URL
SERVICE_URL=$(gcloud run services describe project-idea-generator --region=us-central1 --format="value(status.url)")

echo ""
echo "✅ Deployment completed successfully!"
echo "🌐 Your API is available at: $SERVICE_URL"
echo "📖 API Documentation: $SERVICE_URL/docs"
echo "🔍 Health Check: $SERVICE_URL/health"
echo ""
echo "📝 Next steps:"
echo "1. Update your frontend API_BASE_URL to: $SERVICE_URL/api"
echo "2. Test your application"
echo "3. Update CORS settings if needed"
