from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from bson import ObjectId
from datetime import datetime
import os, uuid, shutil
from db.gridfs import fs
from core.guards import require_student
from db.collections import users_collection
from typing import List

UPLOAD_DIR = "uploads/certificates"
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter(
    prefix="/students/certificates",   # ✅ CHANGED
    tags=["Students"],
    dependencies=[Depends(require_student)]
)


async def validate_faculty_ids(faculty_ids, student):
    from db.collections import faculty_collection

    valid_ids = []

    for fid in faculty_ids:
        faculty = await faculty_collection.find_one({
            "_id": ObjectId(fid),
            "is_active": True,
            "academic.university_id": student["academic"]["university_aishe"]
        })

        if not faculty:
            raise HTTPException(
                400,
                f"Invalid faculty assignment: {fid}"
            )

        valid_ids.append(ObjectId(fid))

    return valid_ids


@router.post("/upload")
async def upload_certificate(
    title: str = Form(...),
    assigned_faculty_ids: List[str] = Form(...),
    file: UploadFile = File(...),
    identity=Depends(require_student)
):
    if file.content_type != "application/pdf":
        raise HTTPException(400, "Only PDF allowed")

    student = await users_collection.find_one(
        {"_id": ObjectId(identity["_id"]), "role": "student"}
    )

    if not student:
        raise HTTPException(404, "Student not found")

    faculty_ids = await validate_faculty_ids(
        assigned_faculty_ids, student
    )

    file_id = fs.put(
        await file.read(),
        filename=file.filename,
        content_type="application/pdf",
        uploaded_at=datetime.utcnow(),
        uploaded_by=ObjectId(identity["_id"])
    )

    cert = {
        "_id": ObjectId(),
        "title": title,
        "file_id": file_id,
        "assigned_faculty_ids": faculty_ids,
        "status": "pending",
        "remarks": None,
        "submitted_at": datetime.utcnow(),
        "verified_by": None,
        "verified_at": None
    }

    await users_collection.update_one(
        {"_id": student["_id"]},
        {"$push": {"certifications": cert}}
    )

    return {"message": "Certificate uploaded successfully"}



@router.post("/internships/upload")
async def upload_internship(
    company: str = Form(...),
    role: str = Form(...),
    duration: str = Form(...),
    assigned_faculty_ids: List[str] = Form(...),
    file: UploadFile = File(...),
    identity=Depends(require_student)
):
    if file.content_type != "application/pdf":
        raise HTTPException(400, "Only PDF allowed")

    student = await users_collection.find_one(
        {"_id": ObjectId(identity["_id"]), "role": "student"}
    )

    if not student:
        raise HTTPException(404, "Student not found")

    faculty_ids = await validate_faculty_ids(
        assigned_faculty_ids, student
    )

    file_id = fs.put(
        await file.read(),
        filename=file.filename,
        content_type="application/pdf",
        uploaded_at=datetime.utcnow(),
        uploaded_by=ObjectId(identity["_id"])
    )

    internship = {
        "_id": ObjectId(),
        "company": company,
        "role": role,
        "duration": duration,
        "file_id": file_id,
        "assigned_faculty_ids": faculty_ids,
        "status": "pending",
        "remarks": None,
        "submitted_at": datetime.utcnow(),
        "verified_by": None,
        "verified_at": None
    }

    await users_collection.update_one(
        {"_id": student["_id"]},
        {"$push": {"internships": internship}}
    )

    return {
        "message": "Internship uploaded successfully",
        "internship_id": str(internship["_id"])
    }






@router.get("/list")
async def list_certificates(identity=Depends(require_student)):
    student = await users_collection.find_one(
        {
            "_id": ObjectId(identity["_id"]),
            "role": "student"
        },
        {"certifications": 1}
    )

    if not student:
        raise HTTPException(404, "Student not found")

    certs = []

    for c in student.get("certifications", []):
        certs.append({
            "_id": str(c["_id"]),
            "title": c.get("title"),
            "status": c.get("status"),
            "remarks": c.get("remarks"),
            "file_id": str(c.get("file_id")) if c.get("file_id") else None,
            "submitted_at": c.get("submitted_at"),
        })

    return certs



@router.get("/internships")
async def list_internships(identity=Depends(require_student)):
    student = await users_collection.find_one(
        {
            "_id": ObjectId(identity["_id"]),
            "role": "student"
        },
        {"internships": 1}
    )

    if not student:
        raise HTTPException(404, "Student not found")

    internships = []

    for i in student.get("internships", []):
        internships.append({
            "_id": str(i["_id"]),
            "company": i.get("company"),
            "role": i.get("role"),
            "duration": i.get("duration"),
            "status": i.get("status"),
            "remarks": i.get("remarks"),
            "file_id": str(i.get("file_id")) if i.get("file_id") else None,
            "submitted_at": i.get("submitted_at"),
        })

    return internships


@router.post("/internships/upload")
async def upload_internship(
    company: str = Form(...),
    role: str = Form(...),
    duration: str = Form(...),
    assigned_faculty_ids: List[str] = Form(...),
    file: UploadFile = File(...),
    identity=Depends(require_student)
):
    # 1️⃣ Validate file
    if file.content_type != "application/pdf":
        raise HTTPException(400, "Only PDF files allowed")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(400, "Empty file")

    # 2️⃣ Store PDF in GridFS
    file_id = fs.put(
        file_bytes,
        filename=file.filename,
        content_type="application/pdf",
        uploaded_at=datetime.utcnow(),
        uploaded_by=ObjectId(identity["_id"])
    )

    # 3️⃣ Internship document
    internship = {
        "_id": ObjectId(),
        "company": company,
        "role": role,
        "duration": duration,
        "file_id": file_id,  # 🔑 GridFS reference
        "assigned_faculty_ids": [ObjectId(fid) for fid in assigned_faculty_ids],
        "status": "pending",
        "remarks": None,
        "submitted_at": datetime.utcnow(),
        "verified_by": None,
        "verified_at": None
    }

    # 4️⃣ Push into student document
    result = await users_collection.update_one(
        {
            "_id": ObjectId(identity["_id"]),
            "role": "student"
        },
        {
            "$push": {"internships": internship}
        }
    )

    if result.matched_count == 0:
        raise HTTPException(404, "Student not found")

    return {
        "message": "Internship uploaded successfully",
        "internship_id": str(internship["_id"])
    }
    
    

from fastapi import Query

@router.get("/documents")
async def list_documents(
    doc_type: str = Query("all"),
    search: str = Query(None),
    identity=Depends(require_student)
):
    student = await users_collection.find_one(
        {"_id": ObjectId(identity["_id"]), "role": "student"},
        {"certifications": 1, "internships": 1}
    )

    results = []

    for c in student.get("certifications", []):
        if c["status"] == "approved":
            results.append({
                "id": str(c["_id"]),
                "type": "certificate",
                "title": c["title"],
                "file_id": str(c["file_id"]),
                "submitted_at": c["submitted_at"].isoformat()
            })

    for i in student.get("internships", []):
        if i["status"] == "approved":
            results.append({
                "id": str(i["_id"]),
                "type": "internship",
                "title": i["company"],
                "file_id": str(i["file_id"]),
                "submitted_at": i["submitted_at"].isoformat()
            })

    return results



@router.delete("/documents/{doc_type}/{doc_id}")
async def delete_document(
    doc_type: str,
    doc_id: str,
    identity=Depends(require_student)
):
    # 🔑 Resolve student id safely
    student_id_raw = identity.get("_id") or identity.get("user_id")
    if not student_id_raw:
        raise HTTPException(401, "Invalid token")

    student_id = ObjectId(student_id_raw)

    # 🔒 Validate document type
    if doc_type not in {"certificate", "internship"}:
        raise HTTPException(400, "Invalid document type")

    array = "certifications" if doc_type == "certificate" else "internships"

    # 🔑 Validate document id
    try:
        doc_oid = ObjectId(doc_id)
    except Exception:
        raise HTTPException(400, "Invalid document id")

    student = await users_collection.find_one(
        {"_id": student_id, "role": "student"},
        {array: 1}
    )

    if not student:
        raise HTTPException(404, "Student not found")

    doc = next(
        (d for d in student.get(array, []) if d.get("_id") == doc_oid),
        None
    )

    if not doc:
        raise HTTPException(404, "Document not found")

    # 🚫 Preserve your existing rule (approved-only delete)
    if doc.get("status") != "approved":
        raise HTTPException(
            403, "Only approved documents can be deleted"
        )

    # 🗑 Delete file from GridFS (safe)
    if doc.get("file_id"):
        try:
            fs.delete(ObjectId(doc["file_id"]))
        except Exception:
            pass  # file may already be gone

    # 🗑 Remove document
    await users_collection.update_one(
        {"_id": student_id},
        {"$pull": {array: {"_id": doc_oid}}}
    )

    return {"message": "Document deleted"}



