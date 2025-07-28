"""
Game-related API endpoints.
Handles gamification questions and scoring.
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from ..models import GameStepsResponse
from ..services import GameService
from ..auth import require_auth

router = APIRouter(prefix="/api", tags=["game"])


@router.get("/game-steps", response_model=GameStepsResponse)
async def get_game_steps(current_user: Dict[str, Any] = Depends(require_auth)):
    """
    Get gamification questions for context gathering.
    Equivalent to Firebase Function: getGameSteps
    """
    try:
        steps = await GameService.get_game_steps()
        return GameStepsResponse(
            success=True,
            steps=steps,
            message="Game steps retrieved successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving game steps: {str(e)}")
