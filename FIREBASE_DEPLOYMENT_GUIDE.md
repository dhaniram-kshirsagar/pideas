# 🔥 Firebase Deployment Guide for Python Backend

This guide shows you how to deploy your Python FastAPI backend using Firebase's integration with Google Cloud Run.

## 🏗️ Deployment Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Firebase        │    │ Google Cloud Run │    │ Firebase        │
│ Hosting         │───▶│ Python Backend   │───▶│ Auth/Firestore  │
│ (Frontend)      │    │ (FastAPI)        │    │ (Database)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

1. **Google Cloud CLI** installed and configured
2. **Firebase project** (your existing one)
3. **Docker** (optional, handled by Cloud Build)
4. **Environment variables** configured

## 🚀 Quick Deployment

### Option 1: Automated Deployment (Recommended)

```bash
cd backend
chmod +x deploy.sh
./deploy.sh
```

### Option 2: Manual Deployment

```bash
# 1. Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# 2. Set your project
gcloud config set project YOUR_FIREBASE_PROJECT_ID

# 3. Deploy
gcloud builds submit --config cloudbuild.yaml .
```

## 🔧 Detailed Setup Steps

### Step 1: Install Google Cloud CLI

**Windows:**
```powershell
# Download and install from: https://cloud.google.com/sdk/docs/install-sdk
# Or use Chocolatey:
choco install gcloudsdk
```

**macOS:**
```bash
# Using Homebrew:
brew install --cask google-cloud-sdk
```

**Linux:**
```bash
# Download and install:
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### Step 2: Authenticate and Configure

```bash
# Login to Google Cloud
gcloud auth login

# Set your Firebase project ID
gcloud config set project YOUR_FIREBASE_PROJECT_ID

# Verify configuration
gcloud config list
```

### Step 3: Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Required for deployment
GEMINI_API_KEY=your_gemini_api_key_here
FIREBASE_PROJECT_ID=your_firebase_project_id

# Optional for production
DEBUG=false
PORT=8000
ALLOWED_ORIGINS=https://your-firebase-app.web.app,https://your-firebase-app.firebaseapp.com
```

### Step 4: Deploy to Cloud Run

```bash
cd backend

# Make deploy script executable (Linux/macOS)
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

**For Windows PowerShell:**
```powershell
cd backend
# Run the deployment manually:
gcloud builds submit --config cloudbuild.yaml .
```

## 🔐 Security Configuration

### Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project → Settings → Service Accounts
3. Generate new private key
4. Store the JSON file securely

### Google Cloud Secrets

The deployment script automatically creates a secret for your Gemini API key:

```bash
# Manual secret creation (if needed)
echo -n "your_gemini_api_key" | gcloud secrets create gemini-api-key --data-file=-
```

### Environment Variables in Cloud Run

```bash
# Set environment variables for Cloud Run service
gcloud run services update project-idea-generator \
  --region=us-central1 \
  --set-env-vars="FIREBASE_PROJECT_ID=your-project-id"
```

## 🌐 Frontend Configuration

After deployment, update your frontend to use the new API URL:

### Update API Client

In `public/api-client.js`:

```javascript
// Replace localhost with your Cloud Run URL
const API_BASE_URL = 'https://project-idea-generator-xxxxx-uc.a.run.app/api';
```

### CORS Configuration

Update your backend's CORS settings in `app/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-firebase-app.web.app",
        "https://your-firebase-app.firebaseapp.com",
        "http://localhost:3000"  # For local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 📊 Monitoring and Logs

### View Logs

```bash
# View Cloud Run logs
gcloud logs read --service=project-idea-generator --region=us-central1

# Follow logs in real-time
gcloud logs tail --service=project-idea-generator --region=us-central1
```

### Monitor Performance

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to Cloud Run → project-idea-generator
3. View metrics, logs, and performance data

## 🔄 CI/CD Pipeline (Optional)

### GitHub Actions Integration

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [ main ]
    paths: [ 'backend/**' ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - id: 'auth'
      uses: 'google-github-actions/auth@v1'
      with:
        credentials_json: '${{ secrets.GCP_SA_KEY }}'
    
    - name: 'Set up Cloud SDK'
      uses: 'google-github-actions/setup-gcloud@v1'
    
    - name: 'Deploy to Cloud Run'
      run: |
        cd backend
        gcloud builds submit --config cloudbuild.yaml .
```

## 💰 Cost Optimization

### Cloud Run Pricing

- **Free tier**: 2 million requests/month
- **Pay-per-use**: Only charged when handling requests
- **Auto-scaling**: Scales to zero when not in use

### Optimization Settings

```yaml
# In cloudbuild.yaml
- '--memory=512Mi'        # Reduce memory if possible
- '--cpu=1'               # Minimum CPU allocation
- '--max-instances=5'     # Limit max instances
- '--concurrency=100'     # Requests per instance
```

## 🐛 Troubleshooting

### Common Issues

1. **Permission Denied**
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **API Not Enabled**
   ```bash
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   ```

3. **CORS Errors**
   - Update `ALLOWED_ORIGINS` in your backend
   - Ensure frontend URL is included

4. **Environment Variables**
   ```bash
   # Check Cloud Run environment variables
   gcloud run services describe project-idea-generator --region=us-central1
   ```

### Debug Mode

Enable debug logging:

```bash
gcloud run services update project-idea-generator \
  --region=us-central1 \
  --set-env-vars="DEBUG=true"
```

## 🔄 Updates and Rollbacks

### Deploy Updates

```bash
# Simply run the deployment again
cd backend
./deploy.sh
```

### Rollback

```bash
# List revisions
gcloud run revisions list --service=project-idea-generator --region=us-central1

# Rollback to previous revision
gcloud run services update-traffic project-idea-generator \
  --region=us-central1 \
  --to-revisions=REVISION_NAME=100
```

## 📈 Scaling Configuration

### Auto-scaling Settings

```bash
gcloud run services update project-idea-generator \
  --region=us-central1 \
  --min-instances=0 \
  --max-instances=10 \
  --concurrency=80
```

## 🎯 Production Checklist

- [ ] Environment variables configured
- [ ] CORS settings updated for production domains
- [ ] Firebase service account key secured
- [ ] Monitoring and alerting set up
- [ ] Custom domain configured (optional)
- [ ] SSL certificate verified
- [ ] Load testing completed
- [ ] Backup and disaster recovery plan

## 🌟 Benefits of This Approach

1. **Seamless Integration**: Works perfectly with existing Firebase setup
2. **Auto-scaling**: Scales based on demand
3. **Cost-effective**: Pay only for what you use
4. **Managed Infrastructure**: No server management needed
5. **Global CDN**: Automatic global distribution
6. **Security**: Built-in security features

Your Python backend will be deployed to Google Cloud Run and accessible via a secure HTTPS URL, perfectly integrated with your existing Firebase project!
