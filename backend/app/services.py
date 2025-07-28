"""
Business logic services for the Project Idea Generator.
Contains core functionality migrated from Firebase Functions.
"""

import google.generativeai as genai
from google.cloud import firestore
from typing import List, Dict, Any, Optional
import json
import os
from datetime import datetime
from .models import (
    StudentProfile, GameStep, ProjectIdea, IdeaGenerationRequest,
    HistorySaveRequest, UserManagementRequest, BulkUserRequest
)
from .auth import AuthService

# Initialize Gemini AI
gemini_api_key = os.getenv('GEMINI_API_KEY')
if gemini_api_key:
    genai.configure(api_key=gemini_api_key)
else:
    print("Warning: GEMINI_API_KEY not set")

# Initialize Firestore client
db = firestore.client()


class GameService:
    """Service for handling gamification logic."""
    
    @staticmethod
    async def get_game_steps() -> List[GameStep]:
        """Get gamification questions for context gathering."""
        game_steps = [
            GameStep(
                step_id=1,
                question="What's your primary area of study?",
                options=[
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
                category="academic_background",
                points=10
            ),
            GameStep(
                step_id=2,
                question="What's your current academic year?",
                options=[
                    "1st Year (Freshman)",
                    "2nd Year (Sophomore)",
                    "3rd Year (Junior)",
                    "4th Year (Senior)",
                    "Graduate Student",
                    "Recent Graduate"
                ],
                category="academic_level",
                points=5
            ),
            GameStep(
                step_id=3,
                question="Which technologies excite you the most?",
                options=[
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
                category="technology_interest",
                points=15
            ),
            GameStep(
                step_id=4,
                question="How would you describe your current skill level?",
                options=[
                    "Beginner (Just starting out)",
                    "Intermediate (Some projects completed)",
                    "Advanced (Multiple complex projects)",
                    "Expert (Industry experience)"
                ],
                category="skill_assessment",
                points=10
            ),
            GameStep(
                step_id=5,
                question="What's your preferred team size for projects?",
                options=[
                    "Solo (Individual project)",
                    "Small team (2-3 people)",
                    "Medium team (4-6 people)",
                    "Large team (7+ people)"
                ],
                category="collaboration_preference",
                points=5
            ),
            GameStep(
                step_id=6,
                question="How much time can you dedicate to this project?",
                options=[
                    "1-2 weeks (Quick prototype)",
                    "1 month (Solid MVP)",
                    "3 months (Full-featured project)",
                    "6+ months (Comprehensive solution)"
                ],
                category="time_commitment",
                points=10
            ),
            GameStep(
                step_id=7,
                question="What type of impact do you want to create?",
                options=[
                    "Solve a personal problem",
                    "Help your local community",
                    "Address a global challenge",
                    "Create something innovative/fun",
                    "Build for commercial success",
                    "Contribute to open source"
                ],
                category="impact_motivation",
                points=15
            ),
            GameStep(
                step_id=8,
                question="Which domain interests you most for your project?",
                options=[
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
                category="domain_preference",
                points=20
            )
        ]
        return game_steps


class ProjectIdeaService:
    """Service for generating project ideas using Gemini AI."""
    
    @staticmethod
    def _is_valid_project_idea(idea: Any) -> bool:
        """Helper function to validate project idea structure."""
        required_fields = [
            'title', 'overview', 'objectives', 'technicalRequirements',
            'projectStructure', 'deliverables', 'learningOutcomes',
            'implementationGuide', 'variations'
        ]
        
        if not isinstance(idea, dict):
            return False
            
        return all(field in idea for field in required_fields)
    
    @staticmethod
    async def generate_project_idea(request: IdeaGenerationRequest) -> Optional[ProjectIdea]:
        """Generate a project idea using Gemini AI based on user profile and game responses."""
        try:
            if not gemini_api_key:
                raise Exception("Gemini API key not configured")
            
            # Calculate game score
            game_score = sum(response.get('points', 0) for response in request.game_responses if isinstance(response, dict))
            
            # Create comprehensive prompt
            prompt = f"""
            Generate a detailed, personalized project idea for a student with the following profile:

            **Student Profile:**
            - Stream: {request.student_profile.stream}
            - Year: {request.student_profile.year}
            - Interests: {', '.join(request.student_profile.interests)}
            - Skill Level: {request.student_profile.skill_level}
            - Preferred Technologies: {', '.join(request.student_profile.preferred_technologies)}
            - Team Size: {request.student_profile.team_size}
            - Project Duration: {request.student_profile.project_duration}

            **User Query:** {request.query}

            **Gamification Score:** {game_score}/100 (Higher score indicates more specific preferences)

            **Game Responses Context:**
            {json.dumps(request.game_responses, indent=2)}

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
            model = genai.GenerativeModel('gemini-pro')
            response = model.generate_content(prompt)
            
            if not response.text:
                raise Exception("Empty response from Gemini AI")
            
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
            if not ProjectIdeaService._is_valid_project_idea(idea_data):
                raise Exception("Invalid project idea structure returned")
            
            # Convert to ProjectIdea model
            project_idea = ProjectIdea(**idea_data)
            return project_idea
            
        except Exception as e:
            print(f"Error generating project idea: {e}")
            return None


class HistoryService:
    """Service for managing user project history."""
    
    @staticmethod
    async def save_idea_to_history(request: HistorySaveRequest) -> bool:
        """Save generated idea to user's history."""
        try:
            history_data = {
                'userId': request.user_id,
                'query': request.idea_data.query,
                'idea': request.idea_data.idea,
                'studentProfile': request.idea_data.student_profile.dict(),
                'gameScore': request.idea_data.game_score,
                'gameSteps': request.game_steps,
                'timestamp': datetime.now().isoformat(),
                'createdAt': firestore.SERVER_TIMESTAMP
            }
            
            db.collection('project_history').add(history_data)
            return True
            
        except Exception as e:
            print(f"Error saving idea to history: {e}")
            return False
    
    @staticmethod
    async def get_user_history(user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Get user's project idea history."""
        try:
            history_ref = db.collection('project_history')
            query = history_ref.where('userId', '==', user_id).order_by('createdAt', direction=firestore.Query.DESCENDING).limit(limit)
            
            docs = query.stream()
            history = []
            
            for doc in docs:
                doc_data = doc.to_dict()
                doc_data['id'] = doc.id
                history.append(doc_data)
            
            return history
            
        except Exception as e:
            print(f"Error fetching user history: {e}")
            return []


class AdminService:
    """Service for admin operations."""
    
    @staticmethod
    async def get_user_role(user_id: str) -> Dict[str, Any]:
        """Get user role information."""
        try:
            user_role_ref = db.collection('user_roles').document(user_id)
            user_role_doc = user_role_ref.get()
            
            if user_role_doc.exists:
                user_data = user_role_doc.to_dict()
                return {
                    'role': user_data.get('role', 'user'),
                    'is_admin': user_data.get('role') == 'admin',
                    'status': user_data.get('status', 'active')
                }
            
            return {'role': 'user', 'is_admin': False, 'status': 'active'}
            
        except Exception as e:
            print(f"Error getting user role: {e}")
            return {'role': 'user', 'is_admin': False, 'status': 'active'}
    
    @staticmethod
    async def manage_users(request: UserManagementRequest) -> Dict[str, Any]:
        """Manage user roles and status (admin only)."""
        try:
            # Verify admin status
            is_admin = await AuthService.is_user_admin(request.admin_user_id)
            if not is_admin:
                return {'success': False, 'message': 'Unauthorized: Admin access required'}
            
            if not request.target_user_id:
                # Get all users
                users_ref = db.collection('user_roles')
                docs = users_ref.stream()
                
                users = []
                for doc in docs:
                    user_data = doc.to_dict()
                    user_data['id'] = doc.id
                    users.append(user_data)
                
                await AuthService.log_admin_action(request.admin_user_id, 'view_all_users')
                return {'success': True, 'users': users}
            
            else:
                # Update specific user
                user_role_ref = db.collection('user_roles').document(request.target_user_id)
                user_doc = user_role_ref.get()
                
                if not user_doc.exists:
                    return {'success': False, 'message': 'User not found'}
                
                update_data = {}
                if request.new_role:
                    update_data['role'] = request.new_role
                if request.new_status:
                    update_data['status'] = request.new_status
                
                if update_data:
                    user_role_ref.update(update_data)
                    
                    await AuthService.log_admin_action(
                        request.admin_user_id,
                        'update_user',
                        request.target_user_id,
                        update_data
                    )
                
                return {'success': True, 'message': 'User updated successfully'}
                
        except Exception as e:
            print(f"Error managing users: {e}")
            return {'success': False, 'message': f'Error: {str(e)}'}
    
    @staticmethod
    async def get_admin_logs(admin_user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get admin action logs."""
        try:
            # Verify admin status
            is_admin = await AuthService.is_user_admin(admin_user_id)
            if not is_admin:
                return []
            
            logs_ref = db.collection('admin_logs')
            query = logs_ref.order_by('timestamp', direction=firestore.Query.DESCENDING).limit(limit)
            
            docs = query.stream()
            logs = []
            
            for doc in docs:
                log_data = doc.to_dict()
                log_data['id'] = doc.id
                logs.append(log_data)
            
            return logs
            
        except Exception as e:
            print(f"Error fetching admin logs: {e}")
            return []
    
    @staticmethod
    async def bulk_user_operations(request: BulkUserRequest) -> Dict[str, Any]:
        """Perform bulk operations on users."""
        try:
            # Verify admin status
            is_admin = await AuthService.is_user_admin(request.admin_user_id)
            if not is_admin:
                return {
                    'success': False,
                    'message': 'Unauthorized: Admin access required',
                    'processed_count': 0,
                    'failed_count': 0,
                    'results': []
                }
            
            processed_count = 0
            failed_count = 0
            results = []
            
            for user_id in request.user_ids:
                try:
                    user_role_ref = db.collection('user_roles').document(user_id)
                    user_doc = user_role_ref.get()
                    
                    if not user_doc.exists:
                        failed_count += 1
                        results.append({'user_id': user_id, 'status': 'failed', 'reason': 'User not found'})
                        continue
                    
                    if request.action == 'changeRole' and request.new_role:
                        user_role_ref.update({'role': request.new_role})
                        processed_count += 1
                        results.append({'user_id': user_id, 'status': 'success', 'action': f'Role changed to {request.new_role}'})
                    
                    elif request.action == 'changeStatus' and request.new_status:
                        user_role_ref.update({'status': request.new_status})
                        processed_count += 1
                        results.append({'user_id': user_id, 'status': 'success', 'action': f'Status changed to {request.new_status}'})
                    
                    elif request.action == 'export':
                        user_data = user_doc.to_dict()
                        processed_count += 1
                        results.append({'user_id': user_id, 'status': 'success', 'data': user_data})
                    
                except Exception as e:
                    failed_count += 1
                    results.append({'user_id': user_id, 'status': 'failed', 'reason': str(e)})
            
            # Log bulk operation
            await AuthService.log_admin_action(
                request.admin_user_id,
                f'bulk_{request.action}',
                None,
                {
                    'user_count': len(request.user_ids),
                    'processed': processed_count,
                    'failed': failed_count
                }
            )
            
            return {
                'success': True,
                'processed_count': processed_count,
                'failed_count': failed_count,
                'results': results,
                'message': f'Bulk operation completed: {processed_count} processed, {failed_count} failed'
            }
            
        except Exception as e:
            print(f"Error in bulk user operations: {e}")
            return {
                'success': False,
                'message': f'Error: {str(e)}',
                'processed_count': 0,
                'failed_count': len(request.user_ids),
                'results': []
            }
