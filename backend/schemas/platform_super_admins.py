from pydantic import BaseModel, EmailStr
from typing import Optional

class SuperAdminRequest(BaseModel):
    name: str
    email: EmailStr

    university_name: str
    university_type: str
    aishe_code: str
    ugc_or_aicte_id: str
    official_email_domain: str
    state: str
    district: str

    website: Optional[str] = None
    contact_phone: Optional[str] = None
    established_year: Optional[int] = None
