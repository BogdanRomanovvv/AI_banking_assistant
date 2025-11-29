from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models import LetterType, LetterStatus, FormalityLevel, UserRole, NotificationType


# Auth schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class UserLogin(BaseModel):
    username: str
    password: str


class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    role: UserRole = UserRole.OPERATOR


# User schemas
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    role: UserRole = UserRole.OPERATOR


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    first_name: str
    last_name: str
    middle_name: Optional[str]
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
        use_enum_values = True  # Сериализация enum как строк


# Letter schemas
class LetterCreate(BaseModel):
    subject: str
    body: str
    sender_email: Optional[str] = None
    sender_name: Optional[str] = None


class LetterUpdate(BaseModel):
    status: Optional[LetterStatus] = None
    selected_response: Optional[str] = None
    current_approver: Optional[str] = None
    deadline: Optional[datetime] = None  # Добавляем возможность изменить дедлайн


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
    sla_reasoning: Optional[str]
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
        use_enum_values = True  # Сериализация enum как строк


class AnalysisResponse(BaseModel):
    classification: Dict[str, Any]
    extracted_entities: Dict[str, Any]
    risks: List[Dict[str, Any]]
    required_departments: List[str]
    sla_hours: int
    sla_reasoning: Optional[str] = None
    priority: int
    formality_level: str


class DraftResponsesModel(BaseModel):
    strict_official: str
    corporate: str
    client_oriented: str
    brief_info: str


# Notification schemas
class NotificationCreate(BaseModel):
    user_id: int
    letter_id: Optional[int] = None
    type: NotificationType
    title: str
    message: str


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    letter_id: Optional[int]
    type: NotificationType
    title: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
        use_enum_values = True


class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None


class UnreadCountResponse(BaseModel):
    count: int
