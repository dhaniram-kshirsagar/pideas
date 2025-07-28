"""
Data models for the Project Idea Generator backend.
Migrated from TypeScript interfaces to Pydantic models.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime


class StudentProfile(BaseModel):
    """Student profile for personalized project idea generation."""
    stream: str  # Engineering, Science, Computer Science, etc.
    year: str  # 1st, 2nd, 3rd, 4th year
    interests: List[str]
    skill_level: str  # Beginner, Intermediate, Advanced
    preferred_technologies: List[str]
    team_size: str  # Individual, Small Team (2-3), Large Team (4+)
    project_duration: str  # 1-2 weeks, 1 month, 3 months, 6+ months


class GameStep(BaseModel):
    """Individual gamification step/question."""
    step_id: int
    question: str
    options: List[str]
    category: str
    points: int


class ProjectPhase(BaseModel):
    """Individual project phase with tasks."""
    name: str
    duration: str
    tasks: List[str]


class TechnicalRequirements(BaseModel):
    """Technical requirements for a project."""
    technologies: List[str]
    skills_required: List[str]
    difficulty: str


class ProjectStructure(BaseModel):
    """Project structure with phases."""
    phases: List[ProjectPhase]


class ImplementationGuide(BaseModel):
    """Implementation guide for the project."""
    getting_started: List[str]
    key_resources: List[str]
    common_challenges: List[str]


class ProjectIdea(BaseModel):
    """Complete project idea structure."""
    title: str
    overview: str
    objectives: List[str]
    technical_requirements: TechnicalRequirements
    technologies: List[str]
    skills_required: List[str]
    difficulty: str
    project_structure: ProjectStructure
    phases: List[ProjectPhase]
    deliverables: List[str]
    learning_outcomes: List[str]
    implementation_guide: ImplementationGuide
    variations: List[str]


class IdeaGenerationRequest(BaseModel):
    """Request model for generating project ideas."""
    query: str
    student_profile: StudentProfile
    game_responses: List[Any]


class IdeaData(BaseModel):
    """Idea data for history saving."""
    query: str
    idea: str
    student_profile: StudentProfile
    game_score: int


class HistorySaveRequest(BaseModel):
    """Request model for saving idea to history."""
    user_id: str
    idea_data: IdeaData
    game_steps: List[Any]


class UserRole(BaseModel):
    """User role management model."""
    user_id: str
    email: str
    role: Literal['admin', 'user']
    created_at: str
    last_login: Optional[str] = None
    status: Literal['active', 'inactive']


class AdminAction(BaseModel):
    """Admin action logging model."""
    admin_id: str
    action: str
    target_user_id: Optional[str] = None
    timestamp: str
    details: Any


class UserManagementRequest(BaseModel):
    """Request model for user management operations."""
    admin_user_id: str
    target_user_id: Optional[str] = None
    new_role: Optional[Literal['admin', 'user']] = None
    new_status: Optional[Literal['active', 'inactive']] = None


class BulkUserRequest(BaseModel):
    """Request model for bulk user operations."""
    admin_user_id: str
    user_ids: List[str]
    action: Literal['changeRole', 'changeStatus', 'export']
    new_role: Optional[Literal['admin', 'user']] = None
    new_status: Optional[Literal['active', 'inactive']] = None


# Response models
class GameStepsResponse(BaseModel):
    """Response model for game steps."""
    success: bool
    steps: List[GameStep]
    message: Optional[str] = None


class ProjectIdeaResponse(BaseModel):
    """Response model for generated project idea."""
    success: bool
    idea: Optional[ProjectIdea] = None
    message: Optional[str] = None


class HistoryResponse(BaseModel):
    """Response model for user history."""
    success: bool
    history: List[Dict[str, Any]]
    message: Optional[str] = None


class UserRoleResponse(BaseModel):
    """Response model for user role."""
    success: bool
    role: Optional[str] = None
    is_admin: bool = False
    message: Optional[str] = None


class AdminLogsResponse(BaseModel):
    """Response model for admin logs."""
    success: bool
    logs: List[Dict[str, Any]]
    message: Optional[str] = None


class BulkOperationResponse(BaseModel):
    """Response model for bulk operations."""
    success: bool
    processed_count: int
    failed_count: int
    results: List[Dict[str, Any]]
    message: Optional[str] = None


class StandardResponse(BaseModel):
    """Standard API response model."""
    success: bool
    message: str
    data: Optional[Any] = None
