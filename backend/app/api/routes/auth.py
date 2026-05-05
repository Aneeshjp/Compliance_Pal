"""Authentication routes — register, login, refresh, profile, logout."""

from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, status

from app.core.database import get_database
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
)
from app.models.user import (
    UserRegisterRequest,
    UserLoginRequest,
    UserUpdateRequest,
    RefreshTokenRequest,
    UserResponse,
    TokenResponse,
    AuthResponse,
    MessageResponse,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def _user_to_response(user: dict) -> UserResponse:
    """Convert a MongoDB user doc to a UserResponse."""
    return UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        business_name=user.get("business_name", ""),
        gstin=user.get("gstin"),
        created_at=user.get("created_at", datetime.now(timezone.utc)),
        is_active=user.get("is_active", True),
    )


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegisterRequest):
    """Register a new user account."""
    db = get_database()

    # Check if email already exists
    existing = await db.users.find_one({"email": payload.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    # Create user document
    user_doc = {
        "email": payload.email,
        "hashed_password": hash_password(payload.password),
        "business_name": payload.business_name,
        "gstin": payload.gstin,
        "created_at": datetime.now(timezone.utc),
        "is_active": True,
    }

    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    user_id = str(result.inserted_id)

    # Generate tokens
    access = create_access_token(user_id, payload.email)
    refresh = create_refresh_token(user_id, payload.email)

    return AuthResponse(
        user=_user_to_response(user_doc),
        tokens=TokenResponse(access_token=access, refresh_token=refresh),
    )


@router.post("/login", response_model=AuthResponse)
async def login(payload: UserLoginRequest):
    """Authenticate and return JWT tokens."""
    db = get_database()

    user = await db.users.find_one({"email": payload.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not verify_password(payload.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    user_id = str(user["_id"])
    access = create_access_token(user_id, user["email"])
    refresh = create_refresh_token(user_id, user["email"])

    return AuthResponse(
        user=_user_to_response(user),
        tokens=TokenResponse(access_token=access, refresh_token=refresh),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(payload: RefreshTokenRequest):
    """Validate refresh token and return a new token pair."""
    db = get_database()

    # Check blocklist
    blocked = await db.token_blocklist.find_one({"token": payload.refresh_token})
    if blocked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
        )

    try:
        token_data = decode_token(payload.refresh_token)
        if token_data.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )
        user_id = token_data["sub"]
        email = token_data["email"]
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    # Blocklist old refresh token
    await db.token_blocklist.insert_one({
        "token": payload.refresh_token,
        "expires_at": datetime.fromtimestamp(token_data["exp"], tz=timezone.utc),
    })

    # Issue new pair
    new_access = create_access_token(user_id, email)
    new_refresh = create_refresh_token(user_id, email)

    return TokenResponse(access_token=new_access, refresh_token=new_refresh)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return _user_to_response(current_user)


@router.put("/me", response_model=UserResponse)
async def update_me(
    payload: UserUpdateRequest,
    current_user: dict = Depends(get_current_user),
):
    """Update the current user's business name or GSTIN."""
    db = get_database()
    update_data: dict = {}
    if payload.business_name is not None:
        update_data["business_name"] = payload.business_name
    if payload.gstin is not None:
        update_data["gstin"] = payload.gstin

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    await db.users.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$set": update_data},
    )

    updated = await db.users.find_one({"_id": ObjectId(current_user["_id"])})
    return _user_to_response(updated)


@router.post("/logout", response_model=MessageResponse)
async def logout(
    payload: RefreshTokenRequest,
    current_user: dict = Depends(get_current_user),
):
    """Invalidate the refresh token by adding it to the blocklist."""
    db = get_database()
    try:
        token_data = decode_token(payload.refresh_token)
        await db.token_blocklist.insert_one({
            "token": payload.refresh_token,
            "expires_at": datetime.fromtimestamp(token_data["exp"], tz=timezone.utc),
        })
    except Exception:
        pass  # Token already invalid/expired — still "log out"
    return MessageResponse(message="Logged out successfully")
