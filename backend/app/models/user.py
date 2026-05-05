"""User Pydantic models."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------

class UserRegisterRequest(BaseModel):
    """Registration payload."""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    business_name: str = Field(..., min_length=1, max_length=256)
    gstin: Optional[str] = Field(None, min_length=15, max_length=15)


class UserLoginRequest(BaseModel):
    """Login payload."""
    email: EmailStr
    password: str


class UserUpdateRequest(BaseModel):
    """Profile update payload."""
    business_name: Optional[str] = None
    gstin: Optional[str] = None


class RefreshTokenRequest(BaseModel):
    """Refresh token payload."""
    refresh_token: str


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------

class UserResponse(BaseModel):
    """Public user profile."""
    id: str
    email: str
    business_name: str
    gstin: Optional[str] = None
    created_at: datetime
    is_active: bool = True


class TokenResponse(BaseModel):
    """JWT token pair response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class AuthResponse(BaseModel):
    """Login / register response with user + tokens."""
    user: UserResponse
    tokens: TokenResponse


class MessageResponse(BaseModel):
    """Simple message response."""
    message: str
