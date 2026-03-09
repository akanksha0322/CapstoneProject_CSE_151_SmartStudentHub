from bson import ObjectId
from datetime import datetime

def serialize_mongo(obj):
    """
    Recursively convert MongoDB objects (ObjectId, datetime)
    into JSON-serializable formats.
    """
    if isinstance(obj, ObjectId):
        return str(obj)

    if isinstance(obj, datetime):
        return obj.isoformat()

    if isinstance(obj, list):
        return [serialize_mongo(item) for item in obj]

    if isinstance(obj, dict):
        return {key: serialize_mongo(value) for key, value in obj.items()}

    return obj
