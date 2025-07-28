# Project Idea Generator - Python Backend

This is the Python FastAPI backend for the Project Idea Generator, migrated from Firebase Functions while maintaining full functionality and API compatibility.

## Features

- **AI-Powered Project Generation**: Uses Google Gemini AI to generate personalized project ideas
- **Gamified User Profiling**: Interactive questionnaire system for better project matching
- **User History Management**: Save and retrieve generated project ideas
- **Role-Based Access Control**: Admin and user role management
- **Firebase Integration**: Seamless integration with Firebase Auth and Firestore

## Architecture

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── models.py            # Pydantic data models
│   ├── auth.py              # Authentication and authorization
│   ├── services.py          # Business logic services
│   └── routers/
│       ├── __init__.py
│       ├── game.py          # Gamification endpoints
│       ├── ideas.py         # Project idea generation endpoints
│       └── admin.py         # Admin management endpoints
├── requirements.txt         # Python dependencies
├── .env.example            # Environment variables template
└── README.md               # This file
```

## API Endpoints

### Game Endpoints
- `GET /api/game-steps` - Get gamification questions

### Project Idea Endpoints
- `POST /api/generate-idea` - Generate project idea using AI
- `POST /api/history` - Save idea to user history
- `GET /api/history/{user_id}` - Get user's project history

### Admin Endpoints
- `GET /api/admin/user-role/{user_id}` - Get user role information
- `POST /api/admin/manage-users` - Manage user roles and status
- `GET /api/admin/logs` - Get admin action logs
- `POST /api/admin/bulk-operations` - Perform bulk user operations

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Configuration
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_SERVICE_ACCOUNT_KEY=path/to/service-account-key.json

# Server Configuration
PORT=8000
DEBUG=false
```

### 3. Firebase Service Account Setup

1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate a new private key
3. Save the JSON file and update the `FIREBASE_SERVICE_ACCOUNT_KEY` path in `.env`

### 4. Run the Server

```bash
# Development mode
python -m app.main

# Or using uvicorn directly
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`

## Migration from Firebase Functions

This backend maintains 100% API compatibility with the original Firebase Functions:

### Function Mapping

| Firebase Function | Python Endpoint | Method |
|------------------|-----------------|---------|
| `getGameSteps` | `/api/game-steps` | GET |
| `generateProjectIdea` | `/api/generate-idea` | POST |
| `saveIdeaToHistory` | `/api/history` | POST |
| `getUserHistory` | `/api/history/{user_id}` | GET |
| `getUserRole` | `/api/admin/user-role/{user_id}` | GET |
| `manageUsers` | `/api/admin/manage-users` | POST |
| `getAdminLogs` | `/api/admin/logs` | GET |
| `bulkUserOperations` | `/api/admin/bulk-operations` | POST |

### Data Models

All TypeScript interfaces have been converted to Pydantic models:
- `StudentProfile` → `StudentProfile`
- `ProjectIdea` → `ProjectIdea`
- `GameStep` → `GameStep`
- `UserRole` → `UserRole`
- And all other models...

### Authentication

- Uses the same Firebase JWT tokens
- Maintains role-based access control
- Same user management system

## Frontend Integration

To integrate with your existing frontend, update the API calls from Firebase Functions to HTTP requests:

### Before (Firebase Functions)
```javascript
const functions = getFunctions();
const generateIdea = httpsCallable(functions, 'generateProjectIdea');
const result = await generateIdea(data);
```

### After (Python API)
```javascript
const response = await fetch('http://localhost:8000/api/generate-idea', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`
  },
  body: JSON.stringify(data)
});
const result = await response.json();
```

## Deployment Options

### 1. Google Cloud Run
```bash
# Build and deploy
gcloud run deploy project-idea-generator \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### 2. Docker
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 3. Traditional Server
Deploy to any VPS or cloud provider that supports Python applications.

## Testing

The API includes comprehensive error handling and validation. Test endpoints using:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **Health Check**: `http://localhost:8000/health`

## Benefits of Migration

1. **Cost Reduction**: Eliminate Firebase Functions execution costs
2. **Better Performance**: Faster response times and better resource control
3. **Flexibility**: Deploy anywhere, not limited to Firebase
4. **Scalability**: Better horizontal scaling options
5. **Development**: Easier debugging and local development

## Troubleshooting

### Common Issues

1. **Firebase Authentication Errors**
   - Ensure service account key is correctly configured
   - Verify Firebase project ID matches

2. **Gemini AI Errors**
   - Check API key is valid and has quota
   - Ensure proper internet connectivity

3. **CORS Issues**
   - Update `ALLOWED_ORIGINS` in production
   - Configure proper CORS settings for your domain

### Logs

Enable debug mode for detailed logging:
```env
DEBUG=true
```

## Support

For issues or questions about the migration, please refer to the original Firebase Functions code in `functions/src/index.ts` for reference implementation details.
