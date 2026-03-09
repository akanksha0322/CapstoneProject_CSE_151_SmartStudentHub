from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import datetime
from typing import Optional
from bson import ObjectId
from core.guards import require_super_admin
from db.collections import complaints_collection , faculty_collection , super_admins_collection

router = APIRouter(
    prefix="/superadmin",
    tags=["Super Admin Complaints"],
    dependencies=[Depends(require_super_admin)]
)

# ======================================================
# SERIALIZER
# ======================================================

def serialize_complaint(c):
    return {
        "_id": str(c["_id"]),
        "subject": c.get("subject"),
        "description": c.get("description"),
        "category": c.get("category"),
        "status": c.get("status"),
        "remarks": c.get("remarks"),
        "created_at": c.get("created_at"),
        "updated_at": c.get("updated_at"),
    }


# ======================================================
# LIST COMPLAINTS (ANONYMOUS)
# ======================================================

@router.get("/complaints")
async def list_complaints(
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
):
    filters = {}

    if status:
        filters["status"] = status

    if category:
        filters["category"] = category

    if search:
        filters["$or"] = [
            {"subject": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
        ]

    cursor = complaints_collection.find(
        filters,
        {
            "raised_by": 0,        # 🔒 anonymized
            "raised_by_name": 0,
            "raised_by_email": 0,
        }
    ).sort("created_at", -1)

    return [serialize_complaint(c) async for c in cursor]


# ======================================================
# UPDATE COMPLAINT STATUS
# ======================================================

@router.patch("/complaints/{complaint_id}")
async def update_complaint(
    complaint_id: str,
    payload: dict,
):
    status = payload.get("status")
    remarks = payload.get("remarks")

    if status not in ["open", "in_review", "resolved", "closed"]:
        raise HTTPException(400, "Invalid status")

    result = await complaints_collection.update_one(
        {"_id": ObjectId(complaint_id)},
        {
            "$set": {
                "status": status,
                "remarks": remarks,
                "updated_at": datetime.utcnow()
            }
        }
    )

    if result.matched_count == 0:
        raise HTTPException(404, "Complaint not found")

    return {"message": "Complaint updated"}

@router.patch("/faculty/{faculty_id}/permissions")
async def update_faculty_permissions(
    faculty_id: str,
    permissions: dict,
    admin: dict = Depends(require_super_admin)
):
    # 🔐 Get authoritative super admin from DB
    admin_id = admin.get("user_id") or admin.get("_id")
    if not admin_id:
        raise HTTPException(401, "Invalid admin token")

    super_admin = await super_admins_collection.find_one(
        {"_id": ObjectId(admin_id), "role": "super_admin"},
        {"university.aishe_code": 1}
    )

    if not super_admin:
        raise HTTPException(401, "Super admin not found")

    aishe = super_admin.get("university", {}).get("aishe_code")
    if not aishe:
        raise HTTPException(400, "AISHE not linked")

    # 🔍 Fetch faculty (AISHE isolated)
    faculty = await faculty_collection.find_one({
        "_id": ObjectId(faculty_id),
        "role": "faculty",
        "academic.university_id": aishe
    })
    print(faculty)
    if not faculty:
        raise HTTPException(404, "Faculty not found")

    # ✅ Update permissions
    await faculty_collection.update_one(
        {"_id": ObjectId(faculty_id)},
        {
            "$set": {
                "permissions": permissions,
                "meta.last_updated": datetime.utcnow()
            }
        }
    )

    return {"message": "Faculty permissions updated successfully"}