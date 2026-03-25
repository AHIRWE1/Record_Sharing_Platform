from fastapi import APIRouter, Depends, HTTPException, Request, status
from mysql.connector import Error
from ..database import fetch_one, execute, audit_log
from ..deps import get_optional_user
from ..schemas import LoginRequest, RegisterUserRequest
from ..security import verify_password, create_access_token, hash_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login")
def login(payload: LoginRequest, request: Request):
    user_lookup = payload.username or payload.email
    if not user_lookup or not payload.password:
        raise HTTPException(status_code=400, detail="Username (or email) and password required")

    # bcrypt has a 72-byte limit for passwords — validate early to return a clear error
    if len(payload.password.encode("utf-8")) > 72:
        raise HTTPException(status_code=400, detail="Password too long (max 72 bytes). Please shorten the password.")

    try:
        user = fetch_one(
            "SELECT user_id, username, password, role FROM users WHERE username = %s",
            (user_lookup,),
        )
        if not user:
            audit_log("login_failed", None, {"username": user_lookup, "ip": request.client.host if request.client else None})
            raise HTTPException(status_code=401, detail="Invalid credentials")

        if not verify_password(payload.password, user["password"]):
            audit_log("login_failed", user["user_id"], {"username": user_lookup, "ip": request.client.host if request.client else None})
            raise HTTPException(status_code=401, detail="Invalid credentials")

        token_payload = {"id": user["user_id"], "email": user["username"], "role": user["role"]}
        token = create_access_token(token_payload)
        audit_log("login", user["user_id"], {"ip": request.client.host if request.client else None})
        return {"token": token, "user": token_payload}
    except HTTPException:
        raise
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))


@router.post("/register")
def register_user(payload: RegisterUserRequest, optional_user=Depends(get_optional_user)):
    role = payload.role or "staff"
    if role not in ["doctor", "staff", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    try:
        count_row = fetch_one("SELECT COUNT(*) AS cnt FROM users")
        user_count = int(count_row["cnt"]) if count_row else 0

        if user_count == 0:
            if role != "admin":
                raise HTTPException(status_code=400, detail="First account must have role `admin`")
        else:
            if not optional_user or optional_user.get("role") != "admin":
                raise HTTPException(status_code=403, detail="Forbidden: admin token required")

        # bcrypt has a 72-byte limit for passwords — validate early to avoid hashing errors
        if len(payload.password.encode("utf-8")) > 72:
            raise HTTPException(status_code=400, detail="Password too long (max 72 bytes). Please shorten the password.")

        hashed = hash_password(payload.password)
        new_id, _ = execute(
            "INSERT INTO users (username, password, role) VALUES (%s, %s, %s)",
            (payload.username, hashed, role),
        )
        audit_log("user.register", optional_user.get("id") if optional_user else None, {"newUserId": new_id, "username": payload.username, "role": role})
        return {"user_id": new_id, "username": payload.username, "role": role}
    except HTTPException:
        raise
    except Error as err:
        if err.errno == 1062:
            raise HTTPException(status_code=409, detail="Username already exists")
        raise HTTPException(status_code=500, detail=str(err))
