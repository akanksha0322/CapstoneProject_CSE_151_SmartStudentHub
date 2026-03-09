from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

from db.collections import faculty_collection, users_collection
from core.auth import get_current_user

router = APIRouter(
    prefix="/faculty",
    tags=["Faculty Public"]
)

@router.get("/list")
async def list_faculty_for_students(identity=Depends(get_current_user)):
    """
    Returns ONLY faculty from the same university as the logged-in user
    (AISHE-based isolation)
    """

    # 🔑 Resolve user id safely (no auth change)
    user_id = identity.get("user_id") or identity.get("_id")
    if not user_id:
        raise HTTPException(401, "Invalid token")

    # 🔐 Fetch requesting user to get AISHE (authoritative)
    user = await users_collection.find_one(
        {"_id": ObjectId(user_id)},
        {"academic.university_aishe": 1}
    )

    if not user:
        raise HTTPException(401, "User not found")

    aishe = user.get("academic", {}).get("university_aishe")
    if not aishe:
        raise HTTPException(400, "University context missing")

    faculty = []

    # 🔒 AISHE-BASED ISOLATION (FIXED PART)
    async for doc in faculty_collection.find(
        {
            "is_active": True,
            "academic.university_id": aishe
        },
        {"name": 1, "email": 1}
    ):
        faculty.append({
            "_id": str(doc["_id"]),
            "name": doc.get("name"),
            "email": doc.get("email")
        })

    return faculty
