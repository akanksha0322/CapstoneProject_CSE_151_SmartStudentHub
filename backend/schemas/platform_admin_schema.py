from pydantic import BaseModel, EmailStr

class CreatePlatformAdminRequest(BaseModel):
    name: str
    email: EmailStr
