from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException , UploadFile, File, Depends, HTTPException
from datetime import datetime
from typing import List

from io import BytesIO
import pandas as pd
from core.guards import require_faculty
from db.collections import faculty_collection, users_collection
from db.gridfs import fs

router = APIRouter(
    prefix="/faculty",
    tags=["Faculty"],
    dependencies=[Depends(require_faculty)]
)



async def get_faculty_university_aishe(faculty_id: ObjectId) -> str:
    faculty = await faculty_collection.find_one(
        {"_id": faculty_id},
        {"academic.university_id": 1}
    )

    aishe = faculty.get("academic", {}).get("university_id") if faculty else None
    if not aishe:
        raise HTTPException(403, "Faculty university not configured")

    return aishe

# ======================================================
# FACULTY PROFILE
# ======================================================

async def get_faculty_university(faculty_id: ObjectId):
    faculty = await faculty_collection.find_one(
        {"_id": faculty_id},
        {"academic.university_id": 1}
    )
    if not faculty or not faculty.get("academic", {}).get("university_id"):
        raise HTTPException(403, "Faculty university not configured")
    return faculty["academic"]["university_id"]



@router.get("/me")
async def faculty_me(identity=Depends(require_faculty)):
    faculty_id = identity.get("_id") or identity.get("user_id")
    if not faculty_id:
        raise HTTPException(401, "Invalid token")

    faculty = await faculty_collection.find_one(
        {"_id": ObjectId(faculty_id)},
        {"password": 0}
    )

    if not faculty:
        raise HTTPException(404, "Faculty not found")



    return {
        "id": str(faculty["_id"]),
        "name": faculty.get("name"),
        "email": faculty.get("email"),
        "employee_id": faculty.get("employee_id"),
        "department": faculty.get("academic", {}).get("department"),
        "designation": faculty.get("academic", {}).get("designation"),
        "is_active": faculty.get("is_active", False),

        # 🔒 SHAPE-STABLE PERMISSIONS
        "permissions": {

            **(faculty.get("permissions") or {})
        },

        # 🔒 SHAPE-STABLE STATS
        "verification_stats": {

            **(faculty.get("verification_stats") or {})
        }
    }



# ======================================================
# FACULTY DASHBOARD
# ======================================================

@router.get("/dashboard")
async def faculty_dashboard(identity=Depends(require_faculty)):
    faculty = await faculty_collection.find_one(
        {"_id": ObjectId(identity["_id"])},
        {"verification_stats": 1, "permissions": 1}
    )

    if not faculty:
        raise HTTPException(404, "Faculty not found")

    return {
        "permissions": faculty.get("permissions", {}),
        "verified_count": faculty.get("verification_stats", {}).get("verified_count", 0),
        "rejected_count": faculty.get("verification_stats", {}).get("rejected_count", 0),
    }


# ======================================================
# PENDING CERTIFICATES (ASSIGNED ONLY)
# ======================================================

@router.get("/certificates/pending")
async def pending_certificates(identity=Depends(require_faculty)):
    # 🔑 Resolve faculty ID safely
    faculty_id_raw = identity.get("_id") or identity.get("user_id")
    if not faculty_id_raw:
        raise HTTPException(401, "Invalid token")

    faculty_id = ObjectId(faculty_id_raw)

    # 🔐 Get faculty university (AISHE)
    faculty_university = await get_faculty_university(faculty_id)
    if not faculty_university:
        raise HTTPException(400, "Faculty university not found")

    results = []

    cursor = users_collection.find(
        {
            "academic.university_aishe": faculty_university,
            "certifications": {
                "$elemMatch": {
                    "status": "pending",
                    "assigned_faculty_ids": faculty_id
                }
            }
        },
        {
            "name": 1,
            "register_no": 1,
            "certifications": 1
        }
    )

    async for student in cursor:
        student_id = str(student["_id"])

        for cert in student.get("certifications", []):
            if (
                cert.get("status") == "pending"
                and faculty_id in cert.get("assigned_faculty_ids", [])
            ):
                # print(cert)
                results.append({
                    "student_id": student_id,
                    "student_name": student.get("name"),
                    "register_no": student.get("register_no"),

                    "certificate_id": str(cert["_id"]),
                    "title": cert.get("title"),

                    # ✅ REQUIRED BY FRONTEND
                    "file_id": str(cert["file_id"]) if cert.get("file_id") else None,
                    "submitted_at": (
                        cert.get("submitted_at").isoformat()
                        if cert.get("submitted_at") else None
                    ),

                    "status": cert.get("status")
                })


    return results




# ======================================================
# APPROVE CERTIFICATE
# ======================================================

@router.post("/certificates/{certificate_id}/approve")
async def approve_certificate(certificate_id: str, identity=Depends(require_faculty)):
    faculty_id = ObjectId(identity.get("_id") or identity.get("user_id"))
    aishe = await get_faculty_university_aishe(faculty_id)

    cert_oid = ObjectId(certificate_id)

    result = await users_collection.update_one(
        {
            "academic.university_aishe": aishe,
            "certifications._id": cert_oid,
            "certifications.assigned_faculty_ids": faculty_id,
            "certifications.status": "pending"
        },
        {
            "$set": {
                "certifications.$.status": "approved",
                "certifications.$.verified_by": faculty_id,
                "certifications.$.verified_at": datetime.utcnow()
            }
        }
    )

    if result.modified_count == 0:
        raise HTTPException(403, "Not authorized or already processed")

    await faculty_collection.update_one(
        {"_id": faculty_id},
        {"$inc": {"verification_stats.verified_count": 1}}
    )

    return {"message": "Certificate approved"}



# ======================================================
# REJECT CERTIFICATE
# ======================================================

@router.post("/certificates/{certificate_id}/reject")
async def reject_certificate(
    certificate_id: str,
    identity=Depends(require_faculty)
):
    # 🔑 Resolve faculty id safely
    faculty_id_raw = identity.get("_id") or identity.get("user_id")
    if not faculty_id_raw:
        raise HTTPException(401, "Invalid token")

    faculty_id = ObjectId(faculty_id_raw)

    # 🔐 Get faculty AISHE
    faculty_university = await get_faculty_university(faculty_id)
    if not faculty_university:
        raise HTTPException(400, "Faculty university not found")

    # 🔑 Convert certificate id to ObjectId
    try:
        cert_oid = ObjectId(certificate_id)
    except Exception:
        raise HTTPException(400, "Invalid certificate id")

    # 🔍 Find student with this pending certificate assigned to this faculty
    student = await users_collection.find_one(
        {
            "academic.university_aishe": faculty_university,
            "certifications": {
                "$elemMatch": {
                    "_id": cert_oid,
                    "status": "pending",
                    "assigned_faculty_ids": faculty_id
                }
            }
        }
    )

    if not student:
        raise HTTPException(
            404,
            "Certificate not found, not pending, or not assigned to this faculty"
        )

    # ✅ Reject certificate (positional operator targets correct element)
    await users_collection.update_one(
        {
            "_id": student["_id"],
            "certifications._id": cert_oid
        },
        {
            "$set": {
                "certifications.$.status": "rejected",
                "certifications.$.remarks": "Rejected by faculty",
                "certifications.$.verified_by": faculty_id,
                "certifications.$.verified_at": datetime.utcnow()
            }
        }
    )

    return {"message": "Certificate rejected successfully"}

@router.get("/internships/pending")
async def pending_internships(identity=Depends(require_faculty)):
    # 🔑 Resolve faculty id safely
    faculty_id_raw = identity.get("_id") or identity.get("user_id")
    if not faculty_id_raw:
        raise HTTPException(401, "Invalid token")

    faculty_id = ObjectId(faculty_id_raw)

    # 🔐 Permission check
    faculty = await faculty_collection.find_one(
        {"_id": faculty_id},
        {"permissions": 1}
    )

    if not faculty or not faculty.get("permissions", {}).get("can_verify_internships"):
        raise HTTPException(403, "No permission to verify internships")

    # 🔐 Resolve faculty university (AISHE)
    faculty_university = await get_faculty_university(faculty_id)

    results = []

    cursor = users_collection.find(
        {
            "academic.university_aishe": faculty_university,   # ✅ AISHE
            "internships": {
                "$elemMatch": {
                    "status": "pending",
                    "assigned_faculty_ids": faculty_id
                }
            }
        },
        {"name": 1, "register_no": 1, "internships": 1}
    )

    async for student in cursor:
        for internship in student.get("internships", []):
            if (
                internship.get("status") == "pending"
                and faculty_id in internship.get("assigned_faculty_ids", [])
            ):
                results.append({
                    "internship_id": str(internship["_id"]),
                    "student_id": str(student["_id"]),
                    "student_name": student.get("name"),
                    "register_no": student.get("register_no"),

                    "company": internship.get("company"),
                    "role": internship.get("role"),
                    "duration": internship.get("duration"),

                    # ✅ REQUIRED BY FRONTEND
                    "file_id": (
                        str(internship["file_id"])
                        if internship.get("file_id") else None
                    ),
                    "submitted_at": (
                        internship.get("submitted_at").isoformat()
                        if internship.get("submitted_at") else None
                    ),
                })

    return results


@router.post("/internships/{internship_id}/approve")
async def approve_internship(
    internship_id: str,
    identity=Depends(require_faculty)
):
    # 🔑 Resolve faculty id safely
    faculty_id_raw = identity.get("_id") or identity.get("user_id")
    if not faculty_id_raw:
        raise HTTPException(401, "Invalid token")

    faculty_id = ObjectId(faculty_id_raw)

    # 🔐 Resolve faculty AISHE
    faculty_university = await get_faculty_university(faculty_id)

    # 🔑 Validate internship id
    try:
        internship_oid = ObjectId(internship_id)
    except Exception:
        raise HTTPException(400, "Invalid internship id")

    result = await users_collection.update_one(
        {
            "academic.university_aishe": faculty_university,
            "internships": {
                "$elemMatch": {
                    "_id": internship_oid,
                    "status": "pending",
                    "assigned_faculty_ids": faculty_id
                }
            }
        },
        {
            "$set": {
                "internships.$.status": "approved",
                "internships.$.verified_by": faculty_id,
                "internships.$.verified_at": datetime.utcnow()
            }
        }
    )

    if result.modified_count == 0:
        raise HTTPException(403, "Not authorized or already processed")

    # 📊 Update faculty stats
    await faculty_collection.update_one(
        {"_id": faculty_id},
        {"$inc": {"verification_stats.verified_count": 1}}
    )

    return {"message": "Internship approved"}


@router.post("/internships/{internship_id}/reject")
async def reject_internship(
    internship_id: str,
    payload: dict,
    identity=Depends(require_faculty)
):
    remarks = payload.get("remarks")
    if not remarks:
        raise HTTPException(400, "Remarks required")

    # 🔑 Resolve faculty id safely
    faculty_id_raw = identity.get("_id") or identity.get("user_id")
    if not faculty_id_raw:
        raise HTTPException(401, "Invalid token")

    faculty_id = ObjectId(faculty_id_raw)

    # 🔐 Resolve faculty AISHE
    faculty_university = await get_faculty_university(faculty_id)

    # 🔑 Validate internship id
    try:
        internship_oid = ObjectId(internship_id)
    except Exception:
        raise HTTPException(400, "Invalid internship id")

    result = await users_collection.update_one(
        {
            "academic.university_aishe": faculty_university,
            "internships": {
                "$elemMatch": {
                    "_id": internship_oid,
                    "status": "pending",
                    "assigned_faculty_ids": faculty_id
                }
            }
        },
        {
            "$set": {
                "internships.$.status": "rejected",
                "internships.$.remarks": remarks,
                "internships.$.verified_by": faculty_id,
                "internships.$.verified_at": datetime.utcnow()
            }
        }
    )

    if result.modified_count == 0:
        raise HTTPException(403, "Not authorized or already processed")

    # 📊 Update faculty stats
    await faculty_collection.update_one(
        {"_id": faculty_id},
        {"$inc": {"verification_stats.rejected_count": 1}}
    )

    return {"message": "Internship rejected"}


# ======================================================
# PENDING PROJECTS (ASSIGNED ONLY)
# ======================================================

@router.get("/projects/pending")
async def pending_projects(identity=Depends(require_faculty)):
    # 🔑 Resolve faculty id safely
    faculty_id_raw = identity.get("_id") or identity.get("user_id")
    if not faculty_id_raw:
        raise HTTPException(401, "Invalid token")

    faculty_id = ObjectId(faculty_id_raw)

    # 🔐 Resolve faculty university (AISHE)
    faculty_university = await get_faculty_university(faculty_id)

    results = []

    cursor = users_collection.find(
        {
            # ✅ BACKWARD-COMPATIBLE ISOLATION
            "$or": [
                {"academic.university_aishe": faculty_university},
                {"academic.university_id": faculty_university}
            ],
            "projects": {
                "$elemMatch": {
                    "status": "pending",
                    "assigned_faculty_ids": faculty_id
                }
            }
        },
        {"name": 1, "register_no": 1, "projects": 1}
    )

    async for student in cursor:
        for p in student.get("projects", []):
            if (
                p.get("status") == "pending"
                and faculty_id in p.get("assigned_faculty_ids", [])
            ):
                results.append({
                    "project_id": str(p["_id"]),
                    "student_id": str(student["_id"]),
                    "student_name": student.get("name"),
                    "register_no": student.get("register_no"),

                    "title": p.get("title"),
                    "github_url": p.get("github_url"),
                    "deployment_url": p.get("deployment_url"),

                    "submitted_at": (
                        p.get("submitted_at").isoformat()
                        if p.get("submitted_at") else None
                    )
                })

    return results


# ======================================================
# APPROVE PROJECT
# ======================================================

@router.post("/projects/{project_id}/approve")
async def approve_project(
    project_id: str,
    identity=Depends(require_faculty)
):
    faculty_id_raw = identity.get("_id") or identity.get("user_id")
    if not faculty_id_raw:
        raise HTTPException(401, "Invalid token")

    faculty_id = ObjectId(faculty_id_raw)
    faculty_university = await get_faculty_university(faculty_id)

    try:
        project_oid = ObjectId(project_id)
    except Exception:
        raise HTTPException(400, "Invalid project id")

    result = await users_collection.update_one(
        {
            "$or": [
                {"academic.university_aishe": faculty_university},
                {"academic.university_id": faculty_university}
            ],
            "projects": {
                "$elemMatch": {
                    "_id": project_oid,
                    "status": "pending",
                    "assigned_faculty_ids": faculty_id
                }
            }
        },
        {
            "$set": {
                "projects.$.status": "approved",
                "projects.$.verified_by": faculty_id,
                "projects.$.verified_at": datetime.utcnow()
            }
        }
    )

    if result.modified_count == 0:
        raise HTTPException(403, "Not authorized or already processed")

    await faculty_collection.update_one(
        {"_id": faculty_id},
        {"$inc": {"verification_stats.verified_count": 1}}
    )

    return {"message": "Project approved"}


# ======================================================
# REJECT PROJECT
# ======================================================

@router.post("/projects/{project_id}/reject")
async def reject_project(
    project_id: str,
    payload: dict,
    identity=Depends(require_faculty)
):
    remarks = payload.get("remarks")
    if not remarks:
        raise HTTPException(400, "Remarks required")

    faculty_id_raw = identity.get("_id") or identity.get("user_id")
    if not faculty_id_raw:
        raise HTTPException(401, "Invalid token")

    faculty_id = ObjectId(faculty_id_raw)
    faculty_university = await get_faculty_university(faculty_id)

    try:
        project_oid = ObjectId(project_id)
    except Exception:
        raise HTTPException(400, "Invalid project id")

    result = await users_collection.update_one(
        {
            "$or": [
                {"academic.university_aishe": faculty_university},
                {"academic.university_id": faculty_university}
            ],
            "projects": {
                "$elemMatch": {
                    "_id": project_oid,
                    "status": "pending",
                    "assigned_faculty_ids": faculty_id
                }
            }
        },
        {
            "$set": {
                "projects.$.status": "rejected",
                "projects.$.remarks": remarks,
                "projects.$.verified_by": faculty_id,
                "projects.$.verified_at": datetime.utcnow()
            }
        }
    )

    if result.modified_count == 0:
        raise HTTPException(403, "Not authorized or already processed")

    await faculty_collection.update_one(
        {"_id": faculty_id},
        {"$inc": {"verification_stats.rejected_count": 1}}
    )

    return {"message": "Project rejected"}



REQUIRED_COLUMNS = {
    "register_no",
    "semester",
    "exam_type",
    "subject",
    "marks",
    "total",
}

@router.post("/marks/upload")
async def upload_student_marks(
    file: UploadFile = File(...),
    faculty=Depends(require_faculty),
):
    # 📄 File validation
    if not file.filename.endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Only .xlsx files allowed")

    try:
        contents = await file.read()
        df = pd.read_excel(BytesIO(contents))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Excel file")

    # 🛑 Strict header validation
    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required columns: {sorted(missing)}",
        )

    # 🔐 Resolve faculty ID safely
    faculty_id_raw = faculty.get("_id") or faculty.get("user_id")
    if not faculty_id_raw:
        raise HTTPException(401, "Invalid token")

    faculty_id = ObjectId(faculty_id_raw)

    # 🔐 Resolve faculty university (AISHE)
    faculty_doc = await faculty_collection.find_one(
        {"_id": faculty_id},
        {"academic.university_id": 1}
    )

    faculty_university = (
        faculty_doc.get("academic", {}).get("university_id")
        if faculty_doc else None
    )

    if not faculty_university:
        raise HTTPException(403, "Faculty university not configured")

    processed = 0
    failed = []

    for idx, row in df.iterrows():
        try:
            register_no = str(row["register_no"]).strip()
            semester = int(row["semester"])
            exam_type = str(row["exam_type"]).strip()
            subject = str(row["subject"]).strip()
            marks_obtained = int(row["marks"])
            total_marks = int(row["total"])

            if marks_obtained > total_marks:
                raise ValueError("Marks cannot exceed total")

            # 🔎 Find student (STRICT + AISHE ISOLATED)
            student = await users_collection.find_one(
                {
                    "register_no": register_no,
                    "role": "student",
                    "academic.university_aishe": faculty_university,
                }
            )

            if not student:
                raise ValueError("Student not found in your university")

            # 🚫 Prevent duplicate marks
            for m in student.get("marks", []):
                if (
                    int(m.get("semester")) == semester
                    and m.get("exam_type") == exam_type
                    and m.get("subject") == subject
                ):
                    raise ValueError("Marks already exist for this subject")

            mark_entry = {
                "semester": semester,
                "exam_type": exam_type,
                "subject": subject,
                "marks_obtained": marks_obtained,
                "total_marks": total_marks,
                "uploaded_by": faculty_id,
                "uploaded_at": datetime.utcnow(),
            }

            # ✅ Push marks
            await users_collection.update_one(
                {"_id": student["_id"]},
                {"$push": {"marks": mark_entry}},
            )

            processed += 1

        except Exception as e:
            failed.append(
                {
                    "row": idx + 2,  # Excel row number
                    "error": str(e),
                }
            )

    return {
        "message": "Marks upload completed",
        "processed": processed,
        "failed": len(failed),
        "errors": failed[:10],  # prevent payload explosion
    }
