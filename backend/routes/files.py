from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from bson import ObjectId
from db.gridfs import fs

router = APIRouter(prefix="/files", tags=["Files"])

@router.get("/{file_id}")
async def get_file(file_id: str):
    try:
        grid_out = fs.get(ObjectId(file_id))
    except Exception:
        raise HTTPException(404, "File not found")

    return StreamingResponse(
        grid_out,
        media_type=grid_out.content_type,
        headers={
            "Content-Disposition": f'inline; filename="{grid_out.filename}"'
        }
    )

