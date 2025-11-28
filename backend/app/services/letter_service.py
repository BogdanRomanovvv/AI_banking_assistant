from sqlalchemy.orm import Session
from app.models import Letter, LetterStatus
from app.schemas import LetterCreate, LetterUpdate
from app.services.yandex_gpt import yandex_gpt_service
from datetime import datetime, timedelta
from typing import List, Optional


class LetterService:
    
    @staticmethod
    def create_letter(db: Session, letter_data: LetterCreate) -> Letter:
        """Создание нового письма"""
        letter = Letter(
            subject=letter_data.subject,
            body=letter_data.body,
            sender_email=letter_data.sender_email,
            sender_name=letter_data.sender_name,
            status=LetterStatus.NEW
        )
        db.add(letter)
        db.commit()
        db.refresh(letter)
        return letter
    
    @staticmethod
    async def analyze_letter(db: Session, letter_id: int) -> Letter:
        """Анализ письма через Yandex GPT"""
        letter = db.query(Letter).filter(Letter.id == letter_id).first()
        if not letter:
            raise ValueError("Letter not found")
        
        # Обновляем статус
        letter.status = LetterStatus.ANALYZING
        db.commit()
        
        # Анализ через GPT
        analysis = await yandex_gpt_service.analyze_letter(letter.subject, letter.body)
        
        # Сохранение результатов анализа
        letter.classification_data = analysis.get("classification")
        letter.letter_type = analysis.get("classification", {}).get("type", "other")
        letter.formality_level = analysis.get("formality_level", "neutral")
        letter.sla_hours = analysis.get("sla_hours", 24)
        letter.priority = analysis.get("priority", 2)
        letter.required_departments = analysis.get("required_departments", [])
        letter.extracted_entities = analysis.get("extracted_entities")
        letter.risks = analysis.get("risks", [])
        letter.approval_route = analysis.get("approval_route", [])
        
        # Рассчитываем дедлайн
        letter.deadline = datetime.now() + timedelta(hours=letter.sla_hours)
        
        # Генерация вариантов ответов
        draft_responses = await yandex_gpt_service.generate_responses(
            letter.subject, 
            letter.body, 
            analysis
        )
        letter.draft_responses = draft_responses
        
        # Устанавливаем статус
        letter.status = LetterStatus.DRAFT_READY
        
        db.commit()
        db.refresh(letter)
        return letter
    
    @staticmethod
    def get_letter(db: Session, letter_id: int) -> Optional[Letter]:
        """Получение письма по ID"""
        return db.query(Letter).filter(Letter.id == letter_id).first()
    
    @staticmethod
    def get_letters(db: Session, skip: int = 0, limit: int = 100, status: Optional[LetterStatus] = None) -> List[Letter]:
        """Получение списка писем с фильтрацией"""
        query = db.query(Letter)
        if status:
            query = query.filter(Letter.status == status)
        return query.order_by(Letter.created_at.desc()).offset(skip).limit(limit).all()
    
    @staticmethod
    def update_letter(db: Session, letter_id: int, letter_update: LetterUpdate) -> Letter:
        """Обновление письма"""
        letter = db.query(Letter).filter(Letter.id == letter_id).first()
        if not letter:
            raise ValueError("Letter not found")
        
        update_data = letter_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(letter, field, value)
        
        db.commit()
        db.refresh(letter)
        return letter
    
    @staticmethod
    def start_approval(db: Session, letter_id: int) -> Letter:
        """Начать процесс согласования"""
        letter = db.query(Letter).filter(Letter.id == letter_id).first()
        if not letter:
            raise ValueError("Letter not found")
        
        if not letter.selected_response:
            raise ValueError("No response selected for approval")
        
        letter.status = LetterStatus.IN_APPROVAL
        
        # Устанавливаем первого согласующего из маршрута
        if letter.approval_route and len(letter.approval_route) > 0:
            letter.current_approver = letter.approval_route[0].get("department")
        
        db.commit()
        db.refresh(letter)
        return letter
    
    @staticmethod
    def add_approval_comment(db: Session, letter_id: int, department: str, comment: str, approved: bool) -> Letter:
        """Добавление комментария от согласующего"""
        letter = db.query(Letter).filter(Letter.id == letter_id).first()
        if not letter:
            raise ValueError("Letter not found")
        
        if not letter.approval_comments:
            letter.approval_comments = []
        
        letter.approval_comments.append({
            "department": department,
            "comment": comment,
            "approved": approved,
            "timestamp": datetime.now().isoformat()
        })
        
        # Если отклонено - возвращаем на доработку
        if not approved:
            letter.status = LetterStatus.DRAFT_READY
            letter.current_approver = None
            # Сохраняем черновики и анализ - они уже есть
            db.commit()
            db.refresh(letter)
            return letter
        
        # Если одобрено - переход к следующему согласующему или завершение
        if letter.approval_route:
            current_index = next((i for i, route in enumerate(letter.approval_route) 
                                if route.get("department") == department), None)
            
            if current_index is not None and current_index + 1 < len(letter.approval_route):
                # Переход к следующему
                letter.current_approver = letter.approval_route[current_index + 1].get("department")
            else:
                # Все согласовали
                letter.status = LetterStatus.APPROVED
                letter.current_approver = None
                letter.final_response = letter.selected_response
        
        db.commit()
        db.refresh(letter)
        return letter


letter_service = LetterService()
