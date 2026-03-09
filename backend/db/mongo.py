from motor.motor_asyncio import AsyncIOMotorClient
from core.config import settings

client = AsyncIOMotorClient(settings.MONGO_URI)
db = client[settings.DB_NAME]
# Platform-level database (governance)
platform_db = client["platform_db"]

# University-level database (operations)
university_db = client["university_db"]