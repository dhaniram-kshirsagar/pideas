"""
Firebase Functions for Project Idea Generator - Python Backend
Converted from FastAPI to Firebase Functions while maintaining all functionality.
"""

import json
import os
from datetime import datetime
from typing import Dict, Any, List, Optional

# Firebase Functions imports
from firebase_functions import https_fn, options
from firebase_admin import initialize_app, auth, firestore
import firebase_admin

# Google AI imports
import google.generativeai as genai

# Initialize Firebase Admin SDK
if not firebase_admin._apps:
    initialize_app()

# Initialize Firestore client
db = firestore.client()

# Initialize Gemini AI
# Try multiple sources for API key
gemini_api_key = None
try:
    # First try environment variable
    gemini_api_key = os.environ.get('GEMINI_API_KEY')
    
    # If not found, try Firebase Functions config (legacy)
    if not gemini_api_key:
        try:
            from firebase_functions import params
            gemini_api_key = params.StringParam('GEMINI_API_KEY').value
        except:
            pass
    
    # If still not found, try Firebase config (functions:config)
    if not gemini_api_key:
        try:
            import firebase_functions.params as params
            gemini_api_key = params.StringParam('GEMINI_API_KEY').value
        except:
            pass
            
except Exception as e:
    print(f"Warning: Could not load Gemini API key: {e}")

if gemini_api_key:
    genai.configure(api_key=gemini_api_key)
else:
    print("Warning: Gemini API key not configured. Set GEMINI_API_KEY environment variable.")


# Helper functions
def verify_auth(request) -> Dict[str, Any]:
    """Verify Firebase authentication token."""
    try:
        # Get the Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            raise ValueError('Missing or invalid authorization header')
        
        # Extract token
        token = auth_header.split('Bearer ')[1]
        
        # Verify token
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message=f"Authentication failed: {str(e)}"
        )


def is_user_admin(user_id: str) -> bool:
    """Check if user has admin role."""
    try:
        user_role_ref = db.collection('user_roles').document(user_id)
        user_role_doc = user_role_ref.get()
        
        if user_role_doc.exists:
            user_data = user_role_doc.to_dict()
            return user_data.get('role') == 'admin' and user_data.get('status') == 'active'
        
        return False
    except Exception:
        return False


def ensure_user_role(user_id: str, email: str) -> None:
    """Ensure user role exists in database."""
    try:
        user_role_ref = db.collection('user_roles').document(user_id)
        user_role_doc = user_role_ref.get()
        
        if not user_role_doc.exists:
            # Create new user role with default 'user' role
            user_role_data = {
                'userId': user_id,
                'email': email,
                'role': 'user',
                'createdAt': datetime.now().isoformat(),
                'status': 'active'
            }
            user_role_ref.set(user_role_data)
        else:
            # Update last login
            user_role_ref.update({
                'lastLogin': datetime.now().isoformat()
            })
    except Exception as e:
        print(f"Error ensuring user role: {e}")


def log_admin_action(admin_id: str, action: str, target_user_id: Optional[str] = None, details: Optional[Dict[str, Any]] = None) -> None:
    """Log admin action to database."""
    try:
        admin_log_data = {
            'adminId': admin_id,
            'action': action,
            'targetUserId': target_user_id,
            'timestamp': datetime.now().isoformat(),
            'details': details or {}
        }
        
        db.collection('admin_logs').add(admin_log_data)
    except Exception as e:
        print(f"Error logging admin action: {e}")


def is_valid_project_idea(idea: Any) -> bool:
    """Helper function to validate project idea structure."""
    required_fields = [
        'title', 'overview', 'objectives', 'technicalRequirements',
        'projectStructure', 'deliverables', 'learningOutcomes',
        'implementationGuide', 'variations'
    ]
    
    if not isinstance(idea, dict):
        return False
        
    return all(field in idea for field in required_fields)


# Firebase Functions
@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["GET", "POST"]
    )
)
def getGameSteps(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """
    Get gamification questions for context gathering.
    Equivalent to the original getGameSteps function.
    """
    try:
        # Verify authentication
        if not req.auth:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
                message="Authentication required"
            )
        
        game_steps = [
            {
                "stepId": 1,
                "question": "What's your primary area of study?",
                "options": [
                    "Computer Science & Engineering",
                    "Electronics & Communication",
                    "Mechanical Engineering",
                    "Civil Engineering",
                    "Biotechnology",
                    "Data Science & Analytics",
                    "Other Engineering",
                    "Pure Sciences (Physics, Chemistry, Math)",
                    "Business & Management"
                ],
                "category": "academic_background",
                "points": 10
            },
            {
                "stepId": 2,
                "question": "What's your current academic year?",
                "options": [
                    "1st Year (Freshman)",
                    "2nd Year (Sophomore)",
                    "3rd Year (Junior)",
                    "4th Year (Senior)",
                    "Graduate Student",
                    "Recent Graduate"
                ],
                "category": "academic_level",
                "points": 5
            },
            {
                "stepId": 3,
                "question": "Which technologies excite you the most?",
                "options": [
                    "Web Development (React, Node.js, Django)",
                    "Mobile Development (React Native, Flutter)",
                    "Artificial Intelligence & Machine Learning",
                    "Data Science & Analytics",
                    "Cloud Computing (AWS, Google Cloud)",
                    "Blockchain & Cryptocurrency",
                    "IoT & Embedded Systems",
                    "Game Development",
                    "Cybersecurity",
                    "DevOps & Infrastructure"
                ],
                "category": "technology_interest",
                "points": 15
            },
            {
                "stepId": 4,
                "question": "How would you describe your current skill level?",
                "options": [
                    "Beginner (Just starting out)",
                    "Intermediate (Some projects completed)",
                    "Advanced (Multiple complex projects)",
                    "Expert (Industry experience)"
                ],
                "category": "skill_assessment",
                "points": 10
            },
            {
                "stepId": 5,
                "question": "What's your preferred team size for projects?",
                "options": [
                    "Solo (Individual project)",
                    "Small team (2-3 people)",
                    "Medium team (4-6 people)",
                    "Large team (7+ people)"
                ],
                "category": "collaboration_preference",
                "points": 5
            },
            {
                "stepId": 6,
                "question": "How much time can you dedicate to this project?",
                "options": [
                    "1-2 weeks (Quick prototype)",
                    "1 month (Solid MVP)",
                    "3 months (Full-featured project)",
                    "6+ months (Comprehensive solution)"
                ],
                "category": "time_commitment",
                "points": 10
            },
            {
                "stepId": 7,
                "question": "What type of impact do you want to create?",
                "options": [
                    "Solve a personal problem",
                    "Help your local community",
                    "Address a global challenge",
                    "Create something innovative/fun",
                    "Build for commercial success",
                    "Contribute to open source"
                ],
                "category": "impact_motivation",
                "points": 15
            },
            {
                "stepId": 8,
                "question": "Which domain interests you most for your project?",
                "options": [
                    "Healthcare & Medical Technology",
                    "Education & Learning Platforms",
                    "Environmental & Sustainability",
                    "Finance & Fintech",
                    "Social Media & Communication",
                    "E-commerce & Marketplace",
                    "Entertainment & Gaming",
                    "Productivity & Tools",
                    "Transportation & Logistics",
                    "Agriculture & Food Tech"
                ],
                "category": "domain_preference",
                "points": 20
            }
        ]
        
        return {
            "success": True,
            "steps": game_steps,
            "message": "Game steps retrieved successfully"
        }
        
    except Exception as e:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f"Error retrieving game steps: {str(e)}"
        )


@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["POST"]
    )
)
def generateProjectIdea(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """
    Generate a project idea using Gemini AI based on user profile and game responses.
    Equivalent to the original generateProjectIdea function.
    """
    try:
        # Verify authentication
        if not req.auth:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
                message="Authentication required"
            )
        
        data = req.data
        query = data.get('query', '')
        student_profile = data.get('studentProfile', {})
        game_responses = data.get('gameResponses', [])
        
        print(f"generateProjectIdea called with data: {json.dumps(data, indent=2)}")
        
        if not gemini_api_key:
            print("Error: Gemini API key not configured")
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.FAILED_PRECONDITION,
                message="Gemini API key not configured. Please set GEMINI_API_KEY environment variable."
            )
        
        # Calculate game score
        game_score = sum(response.get('points', 0) for response in game_responses if isinstance(response, dict))
        
        # Create comprehensive prompt
        prompt = f"""
        Generate a detailed, personalized project idea for a student with the following profile:

        **Student Profile:**
        - Stream: {student_profile.get('stream', '')}
        - Year: {student_profile.get('year', '')}
        - Interests: {', '.join(student_profile.get('interests', []))}
        - Skill Level: {student_profile.get('skillLevel', '')}
        - Preferred Technologies: {', '.join(student_profile.get('preferredTechnologies', []))}
        - Team Size: {student_profile.get('teamSize', '')}
        - Project Duration: {student_profile.get('projectDuration', '')}

        **User Query:** {query}

        **Gamification Score:** {game_score}/100 (Higher score indicates more specific preferences)

        **Game Responses Context:**
        {json.dumps(game_responses, indent=2)}

        Please generate a comprehensive project idea that matches their profile and query. The response must be a valid JSON object with the following exact structure:

        {{
          "title": "Project Title",
          "overview": "Brief project description",
          "objectives": ["Objective 1", "Objective 2", "Objective 3"],
          "technicalRequirements": {{
            "technologies": ["Tech1", "Tech2"],
            "skillsRequired": ["Skill1", "Skill2"],
            "difficulty": "Beginner/Intermediate/Advanced"
          }},
          "technologies": ["Tech1", "Tech2", "Tech3"],
          "skillsRequired": ["Skill1", "Skill2", "Skill3"],
          "difficulty": "Beginner/Intermediate/Advanced",
          "projectStructure": {{
            "phases": [
              {{
                "name": "Phase 1: Planning & Setup",
                "duration": "Week 1",
                "tasks": ["Task 1", "Task 2", "Task 3"]
              }},
              {{
                "name": "Phase 2: Core Development",
                "duration": "Weeks 2-X",
                "tasks": ["Task 1", "Task 2", "Task 3"]
              }}
            ]
          }},
          "phases": [
            {{
              "name": "Phase 1: Planning & Setup",
              "duration": "Week 1",
              "tasks": ["Task 1", "Task 2", "Task 3"]
            }}
          ],
          "deliverables": ["Deliverable 1", "Deliverable 2"],
          "learningOutcomes": ["Learning 1", "Learning 2"],
          "implementationGuide": {{
            "gettingStarted": ["Step 1", "Step 2"],
            "keyResources": ["Resource 1", "Resource 2"],
            "commonChallenges": ["Challenge 1", "Challenge 2"]
          }},
          "variations": ["Variation 1", "Variation 2"]
        }}

        Make sure the project is:
        1. Appropriate for their skill level and academic year
        2. Achievable within their preferred timeframe
        3. Aligned with their technology preferences
        4. Suitable for their preferred team size
        5. Relevant to their interests and domain preferences

        Return ONLY the JSON object, no additional text or formatting.
        """
        
        # Generate content using Gemini
        try:
            print("Initializing Gemini model...")
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            print("Sending request to Gemini API...")
            response = model.generate_content(prompt)
            
            print(f"Gemini response received. Has text: {bool(response.text)}")
            
            if not response.text:
                print("Error: Empty response from Gemini AI")
                raise https_fn.HttpsError(
                    code=https_fn.FunctionsErrorCode.INTERNAL,
                    message="Empty response from Gemini AI"
                )
                
        except Exception as gemini_error:
            print(f"Gemini API error: {str(gemini_error)}")
            print(f"Gemini error type: {type(gemini_error)}")
            
            # Check if it's an API key issue
            if "API_KEY" in str(gemini_error).upper() or "INVALID_API_KEY" in str(gemini_error).upper():
                raise https_fn.HttpsError(
                    code=https_fn.FunctionsErrorCode.FAILED_PRECONDITION,
                    message="Invalid or missing Gemini API key. Please check your API key configuration."
                )
            
            # Check if it's a quota/billing issue
            if "quota" in str(gemini_error).lower() or "billing" in str(gemini_error).lower():
                raise https_fn.HttpsError(
                    code=https_fn.FunctionsErrorCode.RESOURCE_EXHAUSTED,
                    message="Gemini API quota exceeded or billing issue. Please check your Google Cloud billing."
                )
            
            # Generic Gemini API error
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.INTERNAL,
                message=f"Gemini API error: {str(gemini_error)}"
            )
        
        # Parse JSON response
        try:
            idea_data = json.loads(response.text.strip())
        except json.JSONDecodeError:
            # Try to extract JSON from response if it's wrapped in markdown
            text = response.text.strip()
            if text.startswith('```json'):
                text = text[7:]
            if text.endswith('```'):
                text = text[:-3]
            idea_data = json.loads(text.strip())
        
        # Validate structure
        if not is_valid_project_idea(idea_data):
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.INTERNAL,
                message="Invalid project idea structure returned"
            )
        
        return {
            "success": True,
            "idea": idea_data,
            "message": "Project idea generated successfully"
        }
        
    except https_fn.HttpsError:
        raise
    except Exception as e:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f"Error generating project idea: {str(e)}"
        )


@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["POST"]
    )
)
def saveIdeaToHistory(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """
    Save generated idea to user's history.
    Equivalent to the original saveIdeaToHistory function.
    """
    try:
        # Verify authentication
        if not req.auth:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
                message="Authentication required"
            )
        
        data = req.data
        user_id = data.get('userId')
        idea_data = data.get('ideaData', {})
        game_steps = data.get('gameSteps', [])
        
        if not user_id:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
                message="User ID is required"
            )
        
        # Verify user can only save to their own history
        if user_id != req.auth.uid:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.PERMISSION_DENIED,
                message="Can only save to your own history"
            )
        
        history_data = {
            'userId': user_id,
            'query': idea_data.get('query', ''),
            'idea': idea_data.get('idea', ''),
            'studentProfile': idea_data.get('studentProfile', {}),
            'gameScore': idea_data.get('gameScore', 0),
            'gameSteps': game_steps,
            'timestamp': datetime.now().isoformat(),
            'createdAt': firestore.SERVER_TIMESTAMP
        }
        
        db.collection('projectHistory').add(history_data)
        
        return {
            "success": True,
            "message": "Idea saved to history successfully"
        }
        
    except https_fn.HttpsError:
        raise
    except Exception as e:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f"Error saving idea to history: {str(e)}"
        )


@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["GET"]
    )
)
def getUserHistory(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """
    Get user's project idea history.
    Equivalent to the original getUserHistory function.
    """
    try:
        # Verify authentication
        if not req.auth:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
                message="Authentication required"
            )
        
        data = req.data
        user_id = data.get('userId', req.auth.uid)
        limit = data.get('limit', 20)
        
        # Verify user can only access their own history
        if user_id != req.auth.uid:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.PERMISSION_DENIED,
                message="Can only access your own history"
            )
        
        history_ref = db.collection('project_history')
        
        try:
            # Try the optimized query first (requires composite index)
            query = history_ref.where('userId', '==', user_id).order_by('createdAt', direction=firestore.Query.DESCENDING).limit(limit)
            docs = query.stream()
        except Exception as e:
            print(f"Composite index query failed, falling back to simple query: {e}")
            # Fallback to simple query without ordering (no index required)
            query = history_ref.where('userId', '==', user_id).limit(limit)
            docs = query.stream()
        
        history = []
        for doc in docs:
            doc_data = doc.to_dict()
            doc_data['id'] = doc.id
            history.append(doc_data)
        
        # Sort in Python if we couldn't sort in Firestore
        if 'createdAt' in str(e) if 'e' in locals() else False:
            history.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        
        return {
            "success": True,
            "history": history,
            "message": "History retrieved successfully"
        }
        
    except https_fn.HttpsError:
        raise
    except Exception as e:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f"Error retrieving user history: {str(e)}"
        )


@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["GET"]
    )
)
def getUserRole(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """
    Get user role information.
    Equivalent to the original getUserRole function.
    """
    try:
        # Verify authentication
        if not req.auth:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
                message="Authentication required"
            )
        
        data = req.data
        user_id = data.get('userId', req.auth.uid)
        
        # Users can check their own role, admins can check any role
        if user_id != req.auth.uid:
            if not is_user_admin(req.auth.uid):
                raise https_fn.HttpsError(
                    code=https_fn.FunctionsErrorCode.PERMISSION_DENIED,
                    message="Can only check your own role"
                )
        
        # Ensure user role exists
        ensure_user_role(req.auth.uid, req.auth.token.get('email', ''))
        
        user_role_ref = db.collection('user_roles').document(user_id)
        user_role_doc = user_role_ref.get()
        
        if user_role_doc.exists:
            user_data = user_role_doc.to_dict()
            return {
                "success": True,
                "role": user_data.get('role', 'user'),
                "isAdmin": user_data.get('role') == 'admin',
                "status": user_data.get('status', 'active'),
                "message": "User role retrieved successfully"
            }
        
        return {
            "success": True,
            "role": 'user',
            "isAdmin": False,
            "status": 'active',
            "message": "User role retrieved successfully"
        }
        
    except https_fn.HttpsError:
        raise
    except Exception as e:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f"Error retrieving user role: {str(e)}"
        )


@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["POST"]
    )
)
def manageUsers(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """
    Manage user roles and status (admin only).
    Equivalent to the original manageUsers function.
    """
    try:
        # Verify authentication
        if not req.auth:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
                message="Authentication required"
            )
        
        # Verify admin status
        if not is_user_admin(req.auth.uid):
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.PERMISSION_DENIED,
                message="Admin access required"
            )
        
        data = req.data
        admin_user_id = data.get('adminUserId', req.auth.uid)
        target_user_id = data.get('targetUserId')
        new_role = data.get('newRole')
        new_status = data.get('newStatus')
        
        if not target_user_id:
            # Get all users
            users_ref = db.collection('user_roles')
            docs = users_ref.stream()
            
            users = []
            for doc in docs:
                user_data = doc.to_dict()
                user_data['id'] = doc.id
                users.append(user_data)
            
            log_admin_action(admin_user_id, 'view_all_users')
            return {
                "success": True,
                "users": users,
                "message": "Users retrieved successfully"
            }
        
        else:
            # Update specific user
            user_role_ref = db.collection('user_roles').document(target_user_id)
            user_doc = user_role_ref.get()
            
            if not user_doc.exists:
                raise https_fn.HttpsError(
                    code=https_fn.FunctionsErrorCode.NOT_FOUND,
                    message="User not found"
                )
            
            update_data = {}
            if new_role:
                update_data['role'] = new_role
            if new_status:
                update_data['status'] = new_status
            
            if update_data:
                user_role_ref.update(update_data)
                
                log_admin_action(
                    admin_user_id,
                    'update_user',
                    target_user_id,
                    update_data
                )
            
            return {
                "success": True,
                "message": "User updated successfully"
            }
            
    except https_fn.HttpsError:
        raise
    except Exception as e:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f"Error managing users: {str(e)}"
        )


@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["GET"]
    )
)
def getAdminLogs(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """
    Get admin action logs.
    Equivalent to the original getAdminLogs function.
    """
    try:
        # Verify authentication
        if not req.auth:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
                message="Authentication required"
            )
        
        # Verify admin status
        if not is_user_admin(req.auth.uid):
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.PERMISSION_DENIED,
                message="Admin access required"
            )
        
        data = req.data
        limit = data.get('limit', 50)
        
        logs_ref = db.collection('admin_logs')
        query = logs_ref.order_by('timestamp', direction=firestore.Query.DESCENDING).limit(limit)
        
        docs = query.stream()
        logs = []
        
        for doc in docs:
            log_data = doc.to_dict()
            log_data['id'] = doc.id
            logs.append(log_data)
        
        return {
            "success": True,
            "logs": logs,
            "message": "Admin logs retrieved successfully"
        }
        
    except https_fn.HttpsError:
        raise
    except Exception as e:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f"Error retrieving admin logs: {str(e)}"
        )


@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["POST"]
    )
)
def bulkUserOperations(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """
    Perform bulk operations on users.
    Equivalent to the original bulkUserOperations function.
    """
    try:
        # Verify authentication
        if not req.auth:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
                message="Authentication required"
            )
        
        # Verify admin status
        if not is_user_admin(req.auth.uid):
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.PERMISSION_DENIED,
                message="Admin access required"
            )
        
        data = req.data
        admin_user_id = data.get('adminUserId', req.auth.uid)
        user_ids = data.get('userIds', [])
        action = data.get('action')
        new_role = data.get('newRole')
        new_status = data.get('newStatus')
        
        if not user_ids or not action:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
                message="User IDs and action are required"
            )
        
        processed_count = 0
        failed_count = 0
        results = []
        
        for user_id in user_ids:
            try:
                user_role_ref = db.collection('user_roles').document(user_id)
                user_doc = user_role_ref.get()
                
                if not user_doc.exists:
                    failed_count += 1
                    results.append({'userId': user_id, 'status': 'failed', 'reason': 'User not found'})
                    continue
                
                if action == 'changeRole' and new_role:
                    user_role_ref.update({'role': new_role})
                    processed_count += 1
                    results.append({'userId': user_id, 'status': 'success', 'action': f'Role changed to {new_role}'})
                
                elif action == 'changeStatus' and new_status:
                    user_role_ref.update({'status': new_status})
                    processed_count += 1
                    results.append({'userId': user_id, 'status': 'success', 'action': f'Status changed to {new_status}'})
                
                elif action == 'export':
                    user_data = user_doc.to_dict()
                    processed_count += 1
                    results.append({'userId': user_id, 'status': 'success', 'data': user_data})
                
            except Exception as e:
                failed_count += 1
                results.append({'userId': user_id, 'status': 'failed', 'reason': str(e)})
        
        # Log bulk operation
        log_admin_action(
            admin_user_id,
            f'bulk_{action}',
            None,
            {
                'userCount': len(user_ids),
                'processed': processed_count,
                'failed': failed_count
            }
        )
        
        return {
            "success": True,
            "processedCount": processed_count,
            "failedCount": failed_count,
            "results": results,
            "message": f"Bulk operation completed: {processed_count} processed, {failed_count} failed"
        }
        
    except https_fn.HttpsError:
        raise
    except Exception as e:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f"Error in bulk operations: {str(e)}"
        )
