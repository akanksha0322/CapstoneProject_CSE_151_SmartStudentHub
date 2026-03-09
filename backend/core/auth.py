from fastapi import Request, HTTPException, Depends
from jose import JWTError
from core.security import create_token, verify_password
from jose import jwt
from core.config import settings


COOKIE_NAME = "access_token"


def get_current_user(request: Request):
    token = request.cookies.get(COOKIE_NAME)

    if not token:
        raise HTTPException(401, "Not authenticated")

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )

        return payload   # contains user_id + role

    except JWTError:
        raise HTTPException(401, "Invalid or expired token")
