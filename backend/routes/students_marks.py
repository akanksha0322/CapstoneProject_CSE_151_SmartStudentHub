from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime
from core.guards import require_student
from db.collections import users_collection

router = APIRouter(
    prefix="/students/marks",
    tags=["Students"],
    dependencies=[Depends(require_student)]
)

# ======================================================
# SERIALIZER
# ======================================================

def serialize_mark(mark: dict):
    return {
        "semester": mark.get("semester"),
        "exam_type": mark.get("exam_type"),
        "subject": mark.get("subject"),
        "marks_obtained": mark.get("marks_obtained"),
        "total_marks": mark.get("total_marks"),
        "uploaded_by": (
            str(mark["uploaded_by"])
            if mark.get("uploaded_by") else None
        ),
        "uploaded_at": (
            mark["uploaded_at"].isoformat()
            if mark.get("uploaded_at") else None
        )
    }

# ======================================================
# GET MY MARKS
# ======================================================

@router.get("")
async def get_my_marks(identity=Depends(require_student)):
    student = await users_collection.find_one(
        {
            "_id": ObjectId(identity["_id"]),
            "role": "student"   # 🔒 HARDENED
        },
        {"marks": 1}
    )

    if not student:
        raise HTTPException(404, "Student not found")

    marks = student.get("marks", [])

    return [serialize_mark(m) for m in marks]

# ======================================================
# BASIC STUDENT INFO (OPTIONAL)
# ======================================================

@router.get("/me")
async def student_me(identity=Depends(require_student)):
    print(identity)
    student = await users_collection.find_one(
        {
            "_id": ObjectId(identity["_id"]),
            "role": "student"
        },
        {
            "name": 1,
            "email": 1,
            "status.profile_completed": 1
        }
    )

    if not student:
        raise HTTPException(404, "Student not found")

    return {
        "user_id": str(student["_id"]),
        "name": student.get("name"),
        "email": student.get("email"),
        "profile_completed": student.get("status", {}).get(
            "profile_completed", False
        )
    }
