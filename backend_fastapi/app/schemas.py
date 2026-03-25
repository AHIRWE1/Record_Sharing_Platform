from typing import Optional
from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    password: str


class RegisterUserRequest(BaseModel):
    username: str
    password: str
    role: Optional[str] = "staff"


class RegisterPatientRequest(BaseModel):
    name: str
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    national_id: Optional[str] = None


class UpdatePatientRequest(RegisterPatientRequest):
    pass


class CreateRecordRequest(BaseModel):
    patient_id: int
    diagnosis: Optional[str] = None
    treatment_plan: Optional[str] = None
    clinical_notes: Optional[str] = None


class UpdateRecordRequest(BaseModel):
    diagnosis: Optional[str] = None
    treatment_plan: Optional[str] = None
    clinical_notes: Optional[str] = None
