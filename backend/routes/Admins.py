from fastapi import APIRouter, Depends, HTTPException , Query
from datetime import datetime, timedelta
from bson import ObjectId

from db.collections import users_collection, complaints_collection , super_admins_collection
from core.guards import require_platform_admin, require_super_admin
from services.token_service import generate_reset_token
from services.email_service import send_email
from services.email_templates import build_password_email
from utils.serializer import serialize_mongo

router = APIRouter(
    prefix="/superadmin/admins",
    tags=["University Admins"],
    dependencies=[Depends(require_super_admin)]  # 🔐 ONLY PLATFORM ADMIN
)

# =====================================================
# CREATE UNIVERSITY ADMIN
# =====================================================

@router.post("")
async def create_admin(
    payload: dict,
    identity=Depends(require_super_admin)
):
    name = payload.get("name")
    email = payload.get("email")

    if not name or not email:
        raise HTTPException(400, "name and email are required")

    # 🔐 Resolve super admin university
    super_admin = await super_admins_collection.find_one(
        {"_id": ObjectId(identity["_id"])},
        {"university": 1}
    )

    if not super_admin or not super_admin.get("university"):
        raise HTTPException(403, "University not configured")

    aishe_code = super_admin["university"].get("aishe_code")
    if not aishe_code:
        raise HTTPException(403, "AISHE code missing for university")

    # ❌ Prevent duplicates across platform
    if await super_admins_collection.find_one({"email": email}):
        raise HTTPException(400, "Admin already exists")

    reset_token = generate_reset_token()
    expiry = datetime.utcnow() + timedelta(hours=24)

    doc = {
        "name": name,
        "email": email,
        "role": "admin",   # ✅ UNIVERSITY ADMIN

        "password": None,
        "is_active": False,
        "created_at": datetime.utcnow(),
        "last_login": None,

        # 🔒 UNIVERSITY ISOLATION (AISHE)
        "university_aishe": aishe_code,

        "onboarding": {
            "reset_token": reset_token,
            "reset_token_exp": expiry,
            "email_verified": False
        },

        "meta": {
            "created_by": str(identity["_id"]),
            "source": "super_admin"
        }
    }

    await super_admins_collection.insert_one(doc)

    await send_email(
        email,
        "Activate your University Admin Account",
        build_password_email(name, reset_token)
    )

    return {"message": "University admin created successfully"}

# =====================================================
# LIST UNIVERSITY ADMINS (PLATFORM ONLY)
# =====================================================

@router.get("")
async def list_admins(identity=Depends(require_super_admin)):
    # 🔐 Resolve university from super admin
    super_admin = await super_admins_collection.find_one(
        {"_id": ObjectId(identity["_id"])},
        {"university.aishe_code": 1}
    )

    if not super_admin:
        raise HTTPException(403, "Super admin not found")

    aishe_code = super_admin.get("university", {}).get("aishe_code")
    if not aishe_code:
        raise HTTPException(403, "AISHE code not configured")

    admins = []

    async for doc in super_admins_collection.find(
        {
            "role": "admin",
            "university_aishe": aishe_code   # 🔒 HARD ISOLATION
        },
        {
            "password": 0,
            "onboarding.reset_token": 0,
            "onboarding.reset_token_exp": 0
        }
    ):
        admins.append(serialize_mongo(doc))

    return admins

# =====================================================
# ACTIVATE / DEACTIVATE ADMIN
# =====================================================

@router.patch("/{admin_id}/status")
async def update_admin_status(
    admin_id: str,
    is_active: bool = Query(...),
    identity=Depends(require_super_admin)
):
    # 🔐 Get AISHE code of logged-in super admin
    super_admin = await super_admins_collection.find_one(
        {"_id": ObjectId(identity["_id"])},
        {"university.aishe_code": 1}
    )

    if not super_admin:
        raise HTTPException(403, "Super admin not found")

    aishe_code = super_admin.get("university", {}).get("aishe_code")
    if not aishe_code:
        raise HTTPException(403, "AISHE code not configured")

    # 🔒 Update ONLY admins of same university
    result = await super_admins_collection.update_one(
        {
            "_id": ObjectId(admin_id),
            "role": "admin",
            "university_aishe": aishe_code
        },
        {
            "$set": {
                "is_active": is_active,
                "meta.last_updated": datetime.utcnow()
            }
        }
    )

    if result.matched_count == 0:
        raise HTTPException(
            404,
            "Admin not found or not part of your university"
        )

    return {"message": "Admin status updated successfully"}
# =====================================================
# RESET ADMIN PASSWORD
# =====================================================

@router.post("/{admin_id}/reset-password")
async def reset_admin_password(
    admin_id: str,
    identity=Depends(require_super_admin)
):
    # 🔐 Get AISHE code of logged-in super admin
    super_admin = await super_admins_collection.find_one(
        {"_id": ObjectId(identity["_id"])},
        {"university.aishe_code": 1}
    )

    if not super_admin:
        raise HTTPException(403, "Super admin not found")

    aishe_code = super_admin.get("university", {}).get("aishe_code")
    if not aishe_code:
        raise HTTPException(403, "AISHE code not configured")

    # 🔎 Find admin belonging to same university
    admin = await super_admins_collection.find_one(
        {
            "_id": ObjectId(admin_id),
            "role": "admin",
            "university_aishe": aishe_code
        }
    )

    if not admin:
        raise HTTPException(
            404,
            "Admin not found or not part of your university"
        )

    # 🔑 Generate reset token
    reset_token = generate_reset_token()
    expiry = datetime.utcnow() + timedelta(hours=24)

    # 🔄 Update admin
    await super_admins_collection.update_one(
        {"_id": admin["_id"]},
        {
            "$set": {
                "onboarding.reset_token": reset_token,
                "onboarding.reset_token_exp": expiry,
                "is_active": False,
                "meta.last_updated": datetime.utcnow()
            }
        }
    )

    # 📧 Send reset email
    await send_email(
        admin["email"],
        "Reset your University Admin Password",
        build_password_email(admin["name"], reset_token)
    )

    return {"message": "Password reset email sent successfully"}

# =====================================================
# UNIVERSITY COMPLAINTS (SUPER ADMIN ONLY)
# =====================================================

@router.get("/complaints")
async def list_complaints(identity=Depends(require_super_admin)):
    university_id = identity.get("university_id")

    if not university_id:
        raise HTTPException(400, "University not linked")

    cursor = complaints_collection.find(
        {"university_id": university_id}
    ).sort("created_at", -1)

    results = []

    async for c in cursor:
        results.append({
            "_id": str(c["_id"]),
            "subject": c.get("subject"),
            "description": c.get("description"),
            "category": c.get("category"),
            "status": c.get("status"),
            "remarks": c.get("remarks"),
            "created_at": c.get("created_at"),
            "updated_at": c.get("updated_at"),
        })

    return results
