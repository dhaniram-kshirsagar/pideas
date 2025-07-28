# 🔥 Firebase Studio Deployment Guide for Python Backend

This guide provides step-by-step instructions for deploying your Python FastAPI backend using the Firebase web console (Firebase Studio) and Google Cloud Run integration.

## 📋 Prerequisites

1. **Firebase Project**: Your existing Firebase project
2. **Google Cloud Account**: Linked to your Firebase project (automatically set up)
3. **Python Backend Code**: Your migrated FastAPI backend code
4. **Environment Variables**: Configuration for your backend

## 🚀 Deployment Steps in Firebase Studio

### Step 1: Access Firebase Console

1. Open your web browser and go to [Firebase Console](https://console.firebase.google.com/)
2. Sign in with your Google account
3. Select your Project Idea Generator project

### Step 2: Enable Cloud Run API

1. In the Firebase console, click on the **Build** menu in the left sidebar
2. Select **Hosting**
3. Scroll down and find the **Cloud Run** section
4. Click on **Get started with Cloud Run**
5. If prompted, enable the Cloud Run API by clicking **Enable API**

### Step 3: Create a Cloud Run Service

1. You'll be redirected to the Google Cloud Console
2. In the Cloud Run interface, click **CREATE SERVICE**
3. Configure your service:
   - **Service name**: `project-idea-generator`
   - **Region**: Select a region close to your users (e.g., `us-central1`)
   - **Authentication**: Select **Allow unauthenticated invocations**

### Step 4: Set Up Continuous Deployment

1. Under **Container, Networking, Security** section, click to expand
2. For the first deployment, select **Continuously deploy from source repository**
3. Click **SET UP WITH CLOUD BUILD**
4. Connect to your repository:
   - Select your repository provider (GitHub, Bitbucket, etc.)
   - Authenticate if needed
   - Select your repository containing the Python backend
   - Select the branch to deploy (usually `main` or `master`)

### Step 5: Configure Build Settings

1. In the build configuration:
   - **Source location**: `/backend` (the directory containing your Python code)
   - **Build type**: Select **Dockerfile**
   - If you don't have a Dockerfile yet, select **Buildpacks** instead (Cloud Run will create one for you)

2. If using Buildpacks, specify:
   - **Builder**: `gcr.io/buildpacks/builder:v1`
   - **Runtime**: `python`
   - **Entry point**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Step 6: Configure Environment Variables

1. Scroll down to the **Variables & Secrets** section
2. Click **ADD VARIABLE** for each required environment variable:
   - `GEMINI_API_KEY`: Your Gemini API key
   - `FIREBASE_PROJECT_ID`: Your Firebase project ID
   - `DEBUG`: Set to `false` for production
   - `ALLOWED_ORIGINS`: Comma-separated list of allowed domains (e.g., `https://your-app.web.app,https://your-app.firebaseapp.com`)

3. For sensitive variables like API keys, use Secret Manager:
   - Click **ADD SECRET**
   - Create a new secret (e.g., `gemini-api-key`)
   - Enter your API key value
   - Select the secret and version to use

### Step 7: Configure Advanced Settings

1. Under **Container, Networking, Security**, configure:
   - **Memory allocated**: `512MiB` (increase if needed)
   - **CPU allocation**: `1` (minimum)
   - **Request timeout**: `300` seconds
   - **Maximum instances**: `10` (adjust based on expected traffic)
   - **Minimum instances**: `0` (to scale to zero when not in use)
   - **Concurrency**: `80` (requests per instance)

2. Under **Connections**:
   - Enable **Cloud SQL connections** if you're using a database
   - Configure **VPC connector** if needed for private resources

### Step 8: Deploy the Service

1. Review all settings
2. Click **CREATE** to deploy your service
3. Wait for the build and deployment to complete (this may take several minutes)
4. Once complete, you'll see a green checkmark and a URL for your service

### Step 9: Connect Firebase Hosting to Cloud Run (Optional)

1. Return to the Firebase Console
2. Go to **Hosting** in the left sidebar
3. Click **Add custom domain** to connect your Firebase Hosting to the Cloud Run service:
   - Select your domain
   - For the **Path**, enter `/*` or `/api/*` depending on your setup
   - For **Type**, select **Cloud Run**
   - Select your newly created Cloud Run service
   - Click **Add**

4. Update your `firebase.json` configuration:
   ```json
   {
     "hosting": {
       "public": "public",
       "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
       "rewrites": [
         {
           "source": "/api/**",
           "run": {
             "serviceId": "project-idea-generator",
             "region": "us-central1"
           }
         },
         {
           "source": "**",
           "destination": "/index.html"
         }
       ]
     }
   }
   ```

5. Deploy your updated Firebase configuration:
   ```bash
   firebase deploy --only hosting
   ```

## 🔄 Updating Your Deployment

### To Update Your Backend:

1. Push changes to your connected repository
2. Cloud Build will automatically detect changes and redeploy
3. Monitor the build in the Google Cloud Console

### Manual Redeployment:

1. In the Firebase Console, go to **Hosting**
2. Find your Cloud Run service
3. Click the three-dot menu and select **Edit service**
4. Make your changes
5. Click **DEPLOY** to redeploy

## 🔎 Monitoring Your Deployment

### View Logs:

1. In the Firebase Console, go to **Functions** in the left sidebar
2. Click on the **Logs** tab
3. Filter logs by service name `project-idea-generator`

### Monitor Performance:

1. In the Google Cloud Console, go to **Cloud Run**
2. Select your service `project-idea-generator`
3. View the **Metrics** tab for performance data

## 🌐 Update Frontend Configuration

After deployment, update your frontend to use the new API URL:

1. Open `public/api-client.js`
2. Update the `API_BASE_URL` constant:
   ```javascript
   // Replace with your Cloud Run URL
   const API_BASE_URL = 'https://project-idea-generator-xxxxx-uc.a.run.app/api';
   // Or if using Firebase Hosting with Cloud Run:
   // const API_BASE_URL = 'https://your-app.web.app/api';
   ```

## 🔐 Security Best Practices

1. **API Keys**: Store all API keys in Secret Manager
2. **Authentication**: Ensure Firebase Authentication is properly configured
3. **CORS**: Update your allowed origins in the backend:
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=[
           "https://your-firebase-app.web.app",
           "https://your-firebase-app.firebaseapp.com"
       ],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

## 🐛 Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check build logs in Google Cloud Console
   - Ensure your `requirements.txt` is complete
   - Verify your Dockerfile is correct (if using one)

2. **Runtime Errors**:
   - Check Cloud Run logs
   - Ensure all environment variables are set correctly
   - Verify service account permissions

3. **CORS Errors**:
   - Update `ALLOWED_ORIGINS` in your backend
   - Ensure frontend URL is included in CORS configuration

4. **Authentication Issues**:
   - Verify Firebase service account key is properly configured
   - Check JWT token validation in your backend

### Getting Help:

1. Firebase Support: [Firebase Support](https://firebase.google.com/support)
2. Google Cloud Support: [Google Cloud Support](https://cloud.google.com/support)
3. Stack Overflow: Tag your questions with `firebase` and `google-cloud-run`

## 📊 Cost Management

Firebase and Google Cloud Run use a pay-as-you-go pricing model:

1. **Free Tier**: 2 million requests/month
2. **Pay-per-use**: Only charged when handling requests
3. **Auto-scaling**: Scales to zero when not in use

To monitor and control costs:
1. Set up billing alerts in Google Cloud Console
2. Configure maximum instances to limit scaling
3. Use minimum instances of 0 to scale down when not in use

## 🎯 Production Readiness Checklist

- [ ] Environment variables configured
- [ ] CORS settings updated for production domains
- [ ] Firebase service account key secured
- [ ] Monitoring and alerting set up
- [ ] Custom domain configured (optional)
- [ ] SSL certificate verified
- [ ] Load testing completed
- [ ] Backup and disaster recovery plan

Your Python backend will now be deployed on Google Cloud Run and accessible through Firebase, providing a scalable, reliable, and cost-effective solution for your Project Idea Generator application!
