from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional
from core.auth import get_current_user
from db.collections import complaints_collection

router = APIRouter(
    prefix="/platformadmin",
    tags=["Platform Admin Complaints"],
    dependencies=[]  # injected below
)

# ======================================================
# GUARD
# ======================================================

async def require_platform_admin(user=Depends(get_current_user)):
    if user["role"] != "platform_admin":
        raise HTTPException(403, "Platform admin access required")
    return user


# ✅ APPLY GUARD GLOBALLY
router.dependencies.append(Depends(require_platform_admin))


# ======================================================
# SERIALIZER
# ======================================================

def serialize_complaint(c):
    return {
        "_id": str(c["_id"]),
        "title": c.get("subject", "No subject"),
        "description": c.get("description", ""),
        "category": c.get("category"),
        "status": c.get("status"),
        "remarks": c.get("remarks"),
        "university_id": c.get("university_id"),
        "created_at": c.get("created_at"),
        "updated_at": c.get("updated_at"),

        # ✅ PLATFORM ADMIN SEES STUDENT DETAILS
        "student": {
            "id": str(c["raised_by"]) if c.get("raised_by") else None,
            "name": c.get("raised_by_name"),
            "email": c.get("raised_by_email"),
        }
    }


# ======================================================
# LIST COMPLAINTS
# ======================================================

@router.get("/complaints")
async def list_complaints(
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    university_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
):
    filters = {}

    if status:
        filters["status"] = status

    if category:
        filters["category"] = category

    if university_id:
        filters["university_id"] = university_id  # ✅ string-based university

    if search:
        filters["$or"] = [
            {"subject": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"raised_by_name": {"$regex": search, "$options": "i"}},
            {"raised_by_email": {"$regex": search, "$options": "i"}},
        ]

    cursor = complaints_collection.find(filters).sort("created_at", -1)

    return [serialize_complaint(c) async for c in cursor]
