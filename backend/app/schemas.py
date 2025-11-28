from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models import LetterType, LetterStatus, FormalityLevel


class LetterCreate(BaseModel):
    subject: str
    body: str
    sender_email: Optional[str] = None
    sender_name: Optional[str] = None


class LetterUpdate(BaseModel):
    status: Optional[LetterStatus] = None
    selected_response: Optional[str] = None
    current_approver: Optional[str] = None


class LetterResponse(BaseModel):
    id: int
    subject: str
    body: str
    sender_email: Optional[str]
    sender_name: Optional[str]
    letter_type: Optional[LetterType]
    formality_level: Optional[FormalityLevel]
    status: LetterStatus
    priority: int
    sla_hours: Optional[int]
    classification_data: Optional[Dict[str, Any]]
    extracted_entities: Optional[Dict[str, Any]]
    risks: Optional[List[Dict[str, Any]]]
    required_departments: Optional[List[str]]
    draft_responses: Optional[Dict[str, str]]
    selected_response: Optional[str]
    final_response: Optional[str]
    approval_route: Optional[List[Dict[str, Any]]]
    current_approver: Optional[str]
    approval_comments: Optional[List[Dict[str, Any]]]
    created_at: datetime
    updated_at: Optional[datetime]
    deadline: Optional[datetime]

    class Config:
        from_attributes = True


class AnalysisResponse(BaseModel):
    classification: Dict[str, Any]
    extracted_entities: Dict[str, Any]
    risks: List[Dict[str, Any]]
    required_departments: List[str]
    sla_hours: int
    priority: int
    formality_level: str


class DraftResponsesModel(BaseModel):
    strict_official: str
    corporate: str
    client_oriented: str
    brief_info: str
