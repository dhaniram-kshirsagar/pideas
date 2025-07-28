"""
Project idea generation and history API endpoints.
Handles AI-powered project idea generation and user history management.
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from ..models import (
    IdeaGenerationRequest, ProjectIdeaResponse, HistorySaveRequest,
    HistoryResponse, StandardResponse
)
from ..services import ProjectIdeaService, HistoryService
from ..auth import require_auth

router = APIRouter(prefix="/api", tags=["ideas"])


@router.post("/generate-idea", response_model=ProjectIdeaResponse)
async def generate_project_idea(
    request: IdeaGenerationRequest,
    current_user: Dict[str, Any] = Depends(require_auth)
):
    """
    Generate a project idea using Gemini AI based on user profile and game responses.
    Equivalent to Firebase Function: generateProjectIdea
    """
    try:
        idea = await ProjectIdeaService.generate_project_idea(request)
        
        if idea:
            return ProjectIdeaResponse(
                success=True,
                idea=idea,
                message="Project idea generated successfully"
            )
        else:
            return ProjectIdeaResponse(
                success=False,
                message="Failed to generate project idea. Please try again."
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating project idea: {str(e)}")


@router.post("/history", response_model=StandardResponse)
async def save_idea_to_history(
    request: HistorySaveRequest,
    current_user: Dict[str, Any] = Depends(require_auth)
):
    """
    Save generated idea to user's history.
    Equivalent to Firebase Function: saveIdeaToHistory
    """
    try:
        # Verify user can only save to their own history
        user_id = current_user.get('uid')
        if request.user_id != user_id:
            raise HTTPException(status_code=403, detail="Can only save to your own history")
        
        success = await HistoryService.save_idea_to_history(request)
        
        if success:
            return StandardResponse(
                success=True,
                message="Idea saved to history successfully"
            )
        else:
            return StandardResponse(
                success=False,
                message="Failed to save idea to history"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving idea to history: {str(e)}")


@router.get("/history/{user_id}", response_model=HistoryResponse)
async def get_user_history(
    user_id: str,
    limit: int = 20,
    current_user: Dict[str, Any] = Depends(require_auth)
):
    """
    Get user's project idea history.
    Equivalent to Firebase Function: getUserHistory
    """
    try:
        # Verify user can only access their own history
        current_user_id = current_user.get('uid')
        if user_id != current_user_id:
            raise HTTPException(status_code=403, detail="Can only access your own history")
        
        history = await HistoryService.get_user_history(user_id, limit)
        
        return HistoryResponse(
            success=True,
            history=history,
            message="History retrieved successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving user history: {str(e)}")
