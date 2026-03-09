from db.collections import users_collection
from core.security import hash_password, verify_password, create_token
from models.user_model import Role
from fastapi import HTTPException
from services.token_service import generate_reset_token, get_expiry



async def create_temp_student(student):
    token = generate_reset_token()

    user = {
        "name": student["name"],
        "email": student["email"],
        "roll": student["roll"],
        "department": student["department"],
        "role": "student",
        "is_active": False,
        "password": None,
        "reset_token": token,
        "reset_token_exp": get_expiry()
    }

    await users_collection.insert_one(user)

    return token
