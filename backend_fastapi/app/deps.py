from fastapi import Depends, HTTPException, Request, status
from .security import decode_token


def get_bearer_token(request: Request):
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    return auth.split(" ", 1)[1]


def get_current_user(request: Request):
    token = get_bearer_token(request)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid token")
    return payload


def get_optional_user(request: Request):
    token = get_bearer_token(request)
    if not token:
        return None
    return decode_token(token)


def require_roles(*roles):
    def checker(user=Depends(get_current_user)):
        role = user.get("role")
        if role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: insufficient role")
        return user

    return checker
