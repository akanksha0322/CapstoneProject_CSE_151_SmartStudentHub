from fastapi import APIRouter, HTTPException, Response , Request , Depends
from db.collections import (
    users_collection,
    platform_admins_collection,
    super_admins_collection,
    faculty_collection
)
from bson import ObjectId
from schemas.user_schema import UserLogin
from schemas.password_schema import SetPasswordRequest
from core.security import verify_password, create_token
from core.auth import COOKIE_NAME , get_current_user
from datetime import datetime
from core.security import hash_password

router = APIRouter(prefix="/auth")

async def find_user_by_email(email: str):
    user = await platform_admins_collection.find_one({"email": email})
    if user:
        user["_source"] = "platform_admins"
        return user

    user = await super_admins_collection.find_one({"email": email})
    if user:
        user["_source"] = "super_admins"
        return user

    user = await users_collection.find_one({"email": email})
    if user:
        user["_source"] = "users"
        return user

    user = await faculty_collection.find_one({"email": email})
    if user:
        user["_source"] = "faculty"
        return user

    return None

async def find_user_by_reset_token(token: str):
    user = await platform_admins_collection.find_one(
        {"onboarding.reset_token": token}
    )
    if user:
        user["_source"] = "platform_admins"
        return user

    user = await super_admins_collection.find_one(
        {"onboarding.reset_token": token}
    )
    if user:
        user["_source"] = "super_admins"
        return user

    user = await users_collection.find_one(
        {"onboarding.reset_token": token}
    )
    if user:
        user["_source"] = "users"
        return user

    user = await faculty_collection.find_one(
        {"onboarding.reset_token": token}
    )
    if user:
        user["_source"] = "faculty"
        return user

    return None




@router.post("/login")
async def login(user: UserLogin, response: Response):

    db_user = await find_user_by_email(user.email)
    if not db_user:
        raise HTTPException(404, "User not found")

    if not db_user.get("is_active"):
        raise HTTPException(403, "Account inactive")

    if not verify_password(user.password, db_user["password"]):
        raise HTTPException(401, "Invalid credentials")

    # 🔐 UNIVERSITY RESOLUTION (CRITICAL)
    university_id = None

    if db_user["_source"] in ["users", "faculty", "super_admins"]:
        university_id = (
            db_user.get("university_id")
            or db_user.get("academic", {}).get("university")
        )

    token = create_token({
        "user_id": str(db_user["_id"]),
        "role": db_user["role"],
        "source": db_user["_source"],
        "university_id": university_id   # ✅ FIX
    })

    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=60 * 60 * 24,
    )

    return {"message": "Login successful"}




@router.post("/logout")
async def logout(request: Request, response: Response):

    token = request.cookies.get(COOKIE_NAME)

    if not token:
        raise HTTPException(status_code=400, detail="No active session")

    response.delete_cookie(COOKIE_NAME)

    return {"message": "Logged out successfully"}

@router.get("/me")
async def get_me(request: Request):
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(401, "Not authenticated")

    payload = get_current_user(request)

    user_id = payload.get("user_id")
    role = payload.get("role")
    source = payload.get("source")
    university_id = payload.get("university_id")   # ✅ NEW

    if not user_id or not role or not source:
        raise HTTPException(401, "Invalid token")

    collection_map = {
        "platform_admins": platform_admins_collection,
        "super_admins": super_admins_collection,
        "users": users_collection,
        "faculty": faculty_collection
    }

    collection = collection_map.get(source)
    if collection is None:
        raise HTTPException(401, "Invalid user source")

    user = await collection.find_one(
        {"_id": ObjectId(user_id)},
        {
            "password": 0,
            "onboarding.reset_token": 0,
            "onboarding.reset_token_exp": 0
        }
    )

    if not user:
        raise HTTPException(401, "User not found")

    return {
        "user_id": user_id,
        "role": role,
        "source": source,
        "university_id": university_id,      # ✅ REQUIRED EVERYWHERE
        "name": user.get("name"),
        "email": user.get("email"),
        "status": user.get("status"),
        "academic": user.get("academic"),
        "permissions": user.get("permissions"),
        "verification_stats": user.get("verification_stats"),
    }



@router.post("/set-password")
async def set_password(data: SetPasswordRequest):

    user = await find_user_by_reset_token(data.token)
    if not user:
        raise HTTPException(400, "Invalid token")

    if user["onboarding"]["reset_token_exp"] < datetime.utcnow():
        raise HTTPException(400, "Token expired")

    hashed = hash_password(data.new_password)

    collection_map = {
        "platform_admins": platform_admins_collection,
        "super_admins": super_admins_collection,
        "users": users_collection,
        "faculty": faculty_collection 
        
    }

    await collection_map[user["_source"]].update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "password": hashed,
                "is_active": True,
                "onboarding.email_verified": True,
                "meta.last_updated": datetime.utcnow()
            },
            "$unset": {
                "onboarding.reset_token": "",
                "onboarding.reset_token_exp": ""
            }
        }
    )

    return {"message": "Password set successfully"}


