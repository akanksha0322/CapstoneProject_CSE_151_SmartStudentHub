from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta


pwd_context = CryptContext(schemes=["bcrypt"])

def hash_password(password):
    return pwd_context.hash(password)

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)




