from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import datetime, timedelta
from bson import ObjectId
from typing import Optional

from db.collections import platform_admins_collection, complaints_collection
from core.guards import require_platform_admin
from services.token_service import generate_reset_token
from services.email_service import send_email
from services.email_templates import build_password_email
from schemas.platform_admin_schema import CreatePlatformAdminRequest


router = APIRouter(
    prefix="/platform/admins",
    tags=["Platform Admins"],
    dependencies=[Depends(require_platform_admin)]
)

# ======================================================
# SERIALIZER (SAFE)
# ======================================================

def serialize_mongo(obj):
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, dict):
        return {k: serialize_mongo(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [serialize_mongo(i) for i in obj]
    return obj


# ======================================================
# PLATFORM ADMINS
# ======================================================

@router.get("")
async def list_platform_admins():
    admins = []

    async for doc in platform_admins_collection.find(
        {},
        {"password": 0, "onboarding.reset_token": 0}
    ):
        admins.append(serialize_mongo(doc))

    return admins


@router.post("")
async def create_platform_admin(data: CreatePlatformAdminRequest):
    existing = await platform_admins_collection.find_one(
        {"email": data.email}
    )
    if existing:
        raise HTTPException(400, "Platform admin already exists")

    reset_token = generate_reset_token()
    expiry = datetime.utcnow() + timedelta(hours=24)

    doc = {
        "name": data.name,
        "email": data.email,
        "role": "platform_admin",

        "password": None,
        "is_active": False,
        "created_at": datetime.utcnow(),
        "last_login": None,

        "onboarding": {
            "reset_token": reset_token,
            "reset_token_exp": expiry,
            "email_verified": False
        },

        "meta": {
            "created_by": "platform_admin",
            "last_updated": datetime.utcnow()
        }
    }

    await platform_admins_collection.insert_one(doc)

    await send_email(
        to_email=data.email,
        subject="Activate your Platform Admin account",
        html=build_password_email(data.name, reset_token)
    )

    return {"message": "Platform admin created successfully"}


@router.patch("/{admin_id}/status")
async def update_platform_admin_status(
    admin_id: str,
    is_active: bool = Query(...)
):
    result = await platform_admins_collection.update_one(
        {"_id": ObjectId(admin_id)},
        {
            "$set": {
                "is_active": is_active,
                "meta.last_updated": datetime.utcnow()
            }
        }
    )

    if result.matched_count == 0:
        raise HTTPException(404, "Platform admin not found")

    return {"message": "Status updated"}


# ======================================================
# PLATFORM ADMIN – COMPLAINTS (FULL VISIBILITY)
# ======================================================

@router.get("/complaints")
async def list_all_complaints(
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    university_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    identity=Depends(require_platform_admin)
):
    filters = {}

    if status:
        filters["status"] = status

    if category:
        filters["category"] = category

    if university_id:
        filters["university_id"] = university_id   # string-based university id

    if search:
        filters["$or"] = [
            {"subject": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"raised_by_name": {"$regex": search, "$options": "i"}},
            {"raised_by_email": {"$regex": search, "$options": "i"}},
        ]

    cursor = complaints_collection.find(filters).sort("created_at", -1)

    results = []
    async for c in cursor:
        results.append(serialize_mongo({
            "_id": c["_id"],
            "subject": c.get("subject"),
            "description": c.get("description"),
            "category": c.get("category"),
            "status": c.get("status"),
            "remarks": c.get("remarks"),
            "university_id": c.get("university_id"),
            "raised_by": {
                "id": c.get("raised_by"),
                "name": c.get("raised_by_name"),
                "email": c.get("raised_by_email")
            },
            "created_at": c.get("created_at"),
            "updated_at": c.get("updated_at")
        }))

    return results
