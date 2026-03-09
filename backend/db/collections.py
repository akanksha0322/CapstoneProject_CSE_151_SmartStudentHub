from db.mongo import db
from db.mongo import platform_db, university_db

users_collection = db["user"]

platform_admins_collection = platform_db["platform_admins"]
super_admins_collection = platform_db["super_admins"]
audit_logs_collection = platform_db["audit_logs"]
super_admin_requests_collection = platform_db["super_admin_requests"]
faculty_collection = db["faculty"]
students_collection = db["students"]
complaints_collection = db["complaints"]
