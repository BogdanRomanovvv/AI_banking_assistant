from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Enum as SQLEnum, Boolean
from sqlalchemy.sql import func
from app.database import Base
import enum


class UserRole(str, enum.Enum):
    ADMIN = "admin"  # Полный доступ
    OPERATOR = "operator"  # Обработка писем, создание черновиков
    LAWYER = "lawyer"  # Согласование юридических вопросов (Юридический отдел)
    MARKETING = "marketing"  # Согласование маркетинговых вопросов (Отдел маркетинга)


class LetterType(str, enum.Enum):
    INFO_REQUEST = "info_request"
    COMPLAINT = "complaint"
    REGULATORY = "regulatory"
    PARTNERSHIP = "partnership"
    APPROVAL_REQUEST = "approval_request"
    NOTIFICATION = "notification"
    OTHER = "other"


class LetterStatus(str, enum.Enum):
    NEW = "new"
    ANALYZING = "analyzing"
    DRAFT_READY = "draft_ready"
    IN_APPROVAL = "in_approval"
    APPROVED = "approved"
    SENT = "sent"


class FormalityLevel(str, enum.Enum):
    STRICT_OFFICIAL = "strict_official"
    CORPORATE = "corporate"
    NEUTRAL = "neutral"
    CLIENT_ORIENTED = "client_oriented"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    middle_name = Column(String(100), nullable=True)
    
    role = Column(SQLEnum(UserRole), default=UserRole.OPERATOR, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Letter(Base):
    __tablename__ = "letters"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String(500), nullable=False)
    body = Column(Text, nullable=False)
    sender_email = Column(String(255))
    sender_name = Column(String(255))
    
    # Классификация
    letter_type = Column(SQLEnum(LetterType), nullable=True)
    formality_level = Column(SQLEnum(FormalityLevel), nullable=True)
    
    # Статус и обработка
    status = Column(SQLEnum(LetterStatus), default=LetterStatus.NEW)
    priority = Column(Integer, default=2)  # 1-высокий, 2-средний, 3-низкий
    sla_hours = Column(Integer, nullable=True)
    
    # Анализ (JSON)
    classification_data = Column(JSON, nullable=True)  # Полный результат классификации
    extracted_entities = Column(JSON, nullable=True)  # Извлечённые сущности
    risks = Column(JSON, nullable=True)  # Список рисков
    required_departments = Column(JSON, nullable=True)  # Требуемые подразделения
    
    # Ответы
    draft_responses = Column(JSON, nullable=True)  # 4 варианта ответов
    selected_response = Column(Text, nullable=True)  # Выбранный/отредактированный ответ
    final_response = Column(Text, nullable=True)  # Финальная версия после согласования
    
    # Согласование
    approval_route = Column(JSON, nullable=True)  # Маршрут согласования
    current_approver = Column(String(100), nullable=True)  # Текущий согласующий отдел
    approval_comments = Column(JSON, nullable=True)  # Комментарии от согласующих
    
    # Временные метки
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deadline = Column(DateTime(timezone=True), nullable=True)
