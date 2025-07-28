"""
Admin-related API endpoints.
Handles user management, role assignment, and admin operations.
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from ..models import (
    UserManagementRequest, BulkUserRequest, UserRoleResponse,
    AdminLogsResponse, BulkOperationResponse, StandardResponse
)
from ..services import AdminService
from ..auth import require_auth, require_admin

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/user-role/{user_id}", response_model=UserRoleResponse)
async def get_user_role(
    user_id: str,
    current_user: Dict[str, Any] = Depends(require_auth)
):
    """
    Get user role information.
    Equivalent to Firebase Function: getUserRole
    """
    try:
        # Users can check their own role, admins can check any role
        current_user_id = current_user.get('uid')
        if user_id != current_user_id:
            # Check if current user is admin
            from ..auth import AuthService
            is_admin = await AuthService.is_user_admin(current_user_id)
            if not is_admin:
                raise HTTPException(status_code=403, detail="Can only check your own role")
        
        role_info = await AdminService.get_user_role(user_id)
        
        return UserRoleResponse(
            success=True,
            role=role_info['role'],
            is_admin=role_info['is_admin'],
            message="User role retrieved successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving user role: {str(e)}")


@router.post("/manage-users", response_model=StandardResponse)
async def manage_users(
    request: UserManagementRequest,
    current_user: Dict[str, Any] = Depends(require_admin)
):
    """
    Manage user roles and status (admin only).
    Equivalent to Firebase Function: manageUsers
    """
    try:
        # Ensure admin_user_id matches current user
        current_user_id = current_user.get('uid')
        if request.admin_user_id != current_user_id:
            raise HTTPException(status_code=403, detail="Invalid admin user ID")
        
        result = await AdminService.manage_users(request)
        
        if result['success']:
            return StandardResponse(
                success=True,
                message=result.get('message', 'Operation completed successfully'),
                data=result.get('users')
            )
        else:
            return StandardResponse(
                success=False,
                message=result.get('message', 'Operation failed')
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error managing users: {str(e)}")


@router.get("/logs", response_model=AdminLogsResponse)
async def get_admin_logs(
    limit: int = 50,
    current_user: Dict[str, Any] = Depends(require_admin)
):
    """
    Get admin action logs.
    Equivalent to Firebase Function: getAdminLogs
    """
    try:
        admin_user_id = current_user.get('uid')
        logs = await AdminService.get_admin_logs(admin_user_id, limit)
        
        return AdminLogsResponse(
            success=True,
            logs=logs,
            message="Admin logs retrieved successfully"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving admin logs: {str(e)}")


@router.post("/bulk-operations", response_model=BulkOperationResponse)
async def bulk_user_operations(
    request: BulkUserRequest,
    current_user: Dict[str, Any] = Depends(require_admin)
):
    """
    Perform bulk operations on users.
    Equivalent to Firebase Function: bulkUserOperations
    """
    try:
        # Ensure admin_user_id matches current user
        current_user_id = current_user.get('uid')
        if request.admin_user_id != current_user_id:
            raise HTTPException(status_code=403, detail="Invalid admin user ID")
        
        result = await AdminService.bulk_user_operations(request)
        
        return BulkOperationResponse(
            success=result['success'],
            processed_count=result['processed_count'],
            failed_count=result['failed_count'],
            results=result['results'],
            message=result['message']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in bulk operations: {str(e)}")
