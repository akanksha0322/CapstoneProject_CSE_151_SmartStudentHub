from pymongo import MongoClient
from gridfs import GridFS
from core.config import settings

client = MongoClient(settings.MONGO_URI)
db = client[settings.DB_NAME]

fs = GridFS(db)
