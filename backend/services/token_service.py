from datetime import datetime, timedelta
import uuid

RESET_TOKEN_EXPIRY_HOURS = 24

def generate_reset_token():
    return str(uuid.uuid4())

def get_expiry():
    return datetime.utcnow() + timedelta(hours=RESET_TOKEN_EXPIRY_HOURS)
