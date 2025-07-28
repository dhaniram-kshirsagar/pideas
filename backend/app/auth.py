"""
Authentication and authorization utilities.
Handles Firebase JWT token validation and role-based access control.
"""

import firebase_admin
from firebase_admin import credentials, auth, firestore
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict, Any
import os
from datetime import datetime

# Initialize Firebase Admin SDK
if not firebase_admin._apps:
    # Use default credentials or service account key
    try:
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred)
    except Exception:
        # Fallback to service account key if available
        service_account_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY')
        if service_account_path:
            cred = credentials.Certificate(service_account_path)
            firebase_admin.initialize_app(cred)
        else:
            raise HTTPException(
                status_code=500,
                detail="Firebase credentials not configured"
            )

# Initialize Firestore client
db = firestore.client()

# Security scheme
security = HTTPBearer()


class AuthService:
    """Authentication service for Firebase JWT validation."""
    
    @staticmethod
    async def verify_token(token: str) -> Dict[str, Any]:
        """Verify Firebase JWT token and return decoded token."""
        try:
            decoded_token = auth.verify_id_token(token)
            return decoded_token
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid authentication token: {str(e)}"
            )
    
    @staticmethod
    async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
        """Get current authenticated user from JWT token."""
        token = credentials.credentials
        return await AuthService.verify_token(token)
    
    @staticmethod
    async def is_user_admin(user_id: str) -> bool:
        """Check if user has admin role."""
        try:
            user_role_ref = db.collection('user_roles').document(user_id)
            user_role_doc = user_role_ref.get()
            
            if user_role_doc.exists:
                user_data = user_role_doc.to_dict()
                return user_data.get('role') == 'admin' and user_data.get('status') == 'active'
            
            return False
        except Exception as e:
            print(f"Error checking admin status: {e}")
            return False
    
    @staticmethod
    async def ensure_user_role(user_id: str, email: str) -> None:
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
    
    @staticmethod
    async def log_admin_action(admin_id: str, action: str, target_user_id: Optional[str] = None, details: Optional[Dict[str, Any]] = None) -> None:
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


class RoleChecker:
    """Role-based access control checker."""
    
    def __init__(self, required_admin: bool = False):
        self.required_admin = required_admin
    
    async def __call__(self, current_user: Dict[str, Any] = Depends(AuthService.get_current_user)) -> Dict[str, Any]:
        """Check if user has required permissions."""
        user_id = current_user.get('uid')
        email = current_user.get('email')
        
        if not user_id or not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user token"
            )
        
        # Ensure user role exists
        await AuthService.ensure_user_role(user_id, email)
        
        # Check admin requirement
        if self.required_admin:
            is_admin = await AuthService.is_user_admin(user_id)
            if not is_admin:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Admin access required"
                )
        
        return current_user


# Dependency instances
require_auth = RoleChecker(required_admin=False)
require_admin = RoleChecker(required_admin=True)
