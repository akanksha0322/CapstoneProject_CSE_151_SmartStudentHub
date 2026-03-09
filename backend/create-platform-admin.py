import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient

from core.config import settings
from core.security import hash_password


async def create_platform_admin():
    client = AsyncIOMotorClient(settings.MONGO_URI)
    platform_db = client["platform_db"]
    platform_admins = platform_db["platform_admins"]

    email = "Abhirampb9@gmail.com"        # CHANGE THIS
    name = "Abhiram PB"              # CHANGE THIS
    password = "3717aces"  # CHANGE THIS IMMEDIATELY

    existing = await platform_admins.find_one({"email": email})
    if existing:
        print("❌ Platform admin already exists")
        return

    admin_doc = {
        "name": name,
        "email": email,
        "role": "platform_admin",

        "password": hash_password(password),
        "is_active": True,

        "created_at": datetime.utcnow(),
        "last_login": None,

        "meta": {
            "created_by": "system",
            "created_via": "bootstrap"
        }
    }

    await platform_admins.insert_one(admin_doc)
    print("✅ Platform admin created successfully")


if __name__ == "__main__":
    asyncio.run(create_platform_admin())
