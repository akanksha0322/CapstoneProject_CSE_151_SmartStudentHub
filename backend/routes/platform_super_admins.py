from fastapi import APIRouter, HTTPException, Query , Depends
from datetime import datetime, timedelta
from bson import ObjectId
from typing import Optional
from core.guards import require_platform_admin
from db.collections import (
    super_admins_collection,
    super_admin_requests_collection,
    complaints_collection
)
from schemas.platform_super_admins import SuperAdminRequest
from schemas.super_admin_schema import (
    CreateSuperAdminRequest,
    UniversityVerificationRequest
)
from core.guards import require_platform_admin, require_super_admin
from services.token_service import generate_reset_token
from services.email_service import send_email
from services.email_templates import build_password_email

router = APIRouter(
    prefix="/platform/super-admins",
    tags=["Platform – Super Admins"]
)

# ======================================================
# 1️⃣ PUBLIC — SUPER ADMIN REQUEST (NO AUTH)
# ======================================================

@router.post("/request")
async def request_super_admin(data: SuperAdminRequest):
    # ❌ prevent duplicate requests
    if await super_admin_requests_collection.find_one({"email": data.email}):
        raise HTTPException(400, "Request already submitted")

    # ❌ prevent already approved super admin
    if await super_admins_collection.find_one({"email": data.email}):
        raise HTTPException(400, "Super admin already exists")

    await super_admin_requests_collection.insert_one({
        **data.dict(),
        "status": "pending",
        "created_at": datetime.utcnow()
    })

    return {
        "message": (
            "Request submitted successfully. "
            "You will receive an email once your institution is verified."
        )
    }


# ======================================================
# 2️⃣ PLATFORM ADMIN — CREATE SUPER ADMIN DIRECTLY
# ======================================================

@router.post("")
async def create_super_admin(
    data: CreateSuperAdminRequest,
    user=Depends(require_platform_admin)
):
    if await super_admins_collection.find_one({"email": data.email}):
        raise HTTPException(400, "Super admin already exists")

    reset_token = generate_reset_token()
    expiry = datetime.utcnow() + timedelta(hours=24)

    doc = {
        "name": data.name,
        "email": data.email,
        "role": "super_admin",

        "password": None,
        "is_active": False,
        "created_at": datetime.utcnow(),
        "last_login": None,

        "university": {
            "name": data.university_name
        },

        "verification": {
            "status": "approved",
            "verified_at": datetime.utcnow(),
            "verified_by": user["user_id"],
            "remarks": None
        },

        "onboarding": {
            "reset_token": reset_token,
            "reset_token_exp": expiry,
            "email_verified": False
        }
    }

    await super_admins_collection.insert_one(doc)

    await send_email(
        data.email,
        "Activate your University Admin account",
        build_password_email(data.name, reset_token)
    )

    return {"message": "Super admin created successfully"}


# ======================================================
# 3️⃣ PLATFORM ADMIN — LIST SUPER ADMINS
# ======================================================

@router.get("")
async def list_super_admins(
    status: Optional[str] = Query(None),
    name: Optional[str] = Query(None),
    email: Optional[str] = Query(None),
    university: Optional[str] = Query(None),
    user=Depends(require_platform_admin)
):
    filters = {}

    if status:
        filters["verification.status"] = status
    if name:
        filters["name"] = {"$regex": name, "$options": "i"}
    if email:
        filters["email"] = {"$regex": email, "$options": "i"}
    if university:
        filters["university.name"] = {"$regex": university, "$options": "i"}

    results = []
    async for doc in super_admins_collection.find(filters, {"password": 0}):
        doc["_id"] = str(doc["_id"])
        results.append(doc)

    return results


# ======================================================
# 4️⃣ PLATFORM ADMIN — LIST REQUESTS
# ======================================================

@router.get("/requests")
async def list_super_admin_requests(
    status: Optional[str] = Query("pending"),
    user=Depends(require_platform_admin)
):
    filters = {}
    if status:
        filters["status"] = status

    results = []
    async for doc in super_admin_requests_collection.find(filters):
        doc["_id"] = str(doc["_id"])
        results.append(doc)

    return results


# ======================================================
# 5️⃣ PLATFORM ADMIN — APPROVE REQUEST
# ======================================================

@router.post("/requests/{request_id}/approve")
async def approve_super_admin_request(
    request_id: str,
    user=Depends(require_platform_admin)
):
    req = await super_admin_requests_collection.find_one(
        {"_id": ObjectId(request_id)}
    )

    if not req:
        raise HTTPException(404, "Request not found")

    if req["status"] != "pending":
        raise HTTPException(400, "Request already processed")

    reset_token = generate_reset_token()
    expiry = datetime.utcnow() + timedelta(hours=24)

    await super_admins_collection.insert_one({
        "name": req["name"],
        "email": req["email"],
        "role": "super_admin",

        "password": None,
        "is_active": False,
        "created_at": datetime.utcnow(),
        "last_login": None,

        "university": {
            "name": req["university_name"],
            "type": req["university_type"],
            "aishe_code": req["aishe_code"],
            "ugc_or_aicte_id": req["ugc_or_aicte_id"],
            "official_email_domain": req["official_email_domain"],
            "state": req["state"],
            "district": req["district"],
            "website": req.get("website"),
            "contact_phone": req.get("contact_phone"),
            "established_year": req.get("established_year")
        },

        "verification": {
            "status": "approved",
            "verified_at": datetime.utcnow(),
            "verified_by": user["user_id"],
            "remarks": None
        },

        "onboarding": {
            "reset_token": reset_token,
            "reset_token_exp": expiry,
            "email_verified": False
        }
    })

    await super_admin_requests_collection.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {"status": "approved"}}
    )

    await send_email(
        req["email"],
        "Activate your Super Admin account",
        build_password_email(req["name"], reset_token)
    )

    return {"message": "Super admin approved and email sent"}


# ======================================================
# 6️⃣ PLATFORM ADMIN — REJECT REQUEST
# ======================================================

@router.post("/requests/{request_id}/reject")
async def reject_super_admin_request(
    request_id: str,
    remarks: Optional[str] = Query(None),
    user=Depends(require_platform_admin)
):
    result = await super_admin_requests_collection.update_one(
        {"_id": ObjectId(request_id)},
        {
            "$set": {
                "status": "rejected",
                "remarks": remarks,
                "rejected_at": datetime.utcnow()
            }
        }
    )

    if result.matched_count == 0:
        raise HTTPException(404, "Request not found")

    return {"message": "Request rejected"}
