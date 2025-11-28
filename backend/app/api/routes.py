from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas import LetterCreate, LetterResponse, LetterUpdate
from app.services.letter_service import letter_service
from app.services.mail_service import mail_service
from app.models import LetterStatus
from pydantic import BaseModel


router = APIRouter(prefix="/api/letters", tags=["letters"])
mail_router = APIRouter(prefix="/api/mail", tags=["mail"])


@router.post("/", response_model=LetterResponse, status_code=status.HTTP_201_CREATED)
def create_letter(letter: LetterCreate, db: Session = Depends(get_db)):
    """Создание нового письма"""
    return letter_service.create_letter(db, letter)


@router.get("/", response_model=List[LetterResponse])
def get_letters(
    skip: int = 0, 
    limit: int = 100, 
    status: Optional[LetterStatus] = None,
    db: Session = Depends(get_db)
):
    """Получение списка писем"""
    return letter_service.get_letters(db, skip, limit, status)


@router.get("/{letter_id}", response_model=LetterResponse)
def get_letter(letter_id: int, db: Session = Depends(get_db)):
    """Получение письма по ID"""
    letter = letter_service.get_letter(db, letter_id)
    if not letter:
        raise HTTPException(status_code=404, detail="Letter not found")
    return letter


@router.post("/{letter_id}/analyze", response_model=LetterResponse)
async def analyze_letter(letter_id: int, db: Session = Depends(get_db)):
    """Анализ письма через AI"""
    try:
        return await letter_service.analyze_letter(db, letter_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/{letter_id}", response_model=LetterResponse)
def update_letter(letter_id: int, letter_update: LetterUpdate, db: Session = Depends(get_db)):
    """Обновление письма"""
    try:
        return letter_service.update_letter(db, letter_id, letter_update)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{letter_id}/approval/start", response_model=LetterResponse)
def start_approval(letter_id: int, db: Session = Depends(get_db)):
    """Начать процесс согласования"""
    try:
        return letter_service.start_approval(db, letter_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


class ApprovalCommentRequest(BaseModel):
    department: str
    comment: str
    approved: bool


@router.post("/{letter_id}/approval/comment", response_model=LetterResponse)
def add_approval_comment(
    letter_id: int, 
    comment_data: ApprovalCommentRequest,
    db: Session = Depends(get_db)
):
    """Добавление комментария от согласующего"""
    try:
        return letter_service.add_approval_comment(
            db, 
            letter_id, 
            comment_data.department, 
            comment_data.comment, 
            comment_data.approved
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# Mail endpoints
@mail_router.post("/check", response_model=dict)
def check_mail_manually(db: Session = Depends(get_db)):
    """Ручная проверка почты на новые письма"""
    try:
        if not mail_service.client:
            connected = mail_service.connect()
            if not connected:
                raise HTTPException(
                    status_code=503, 
                    detail="Не удалось подключиться к почтовому серверу. Проверьте настройки в .env"
                )
        
        letters = mail_service.fetch_new_emails(db)
        return {
            "status": "success",
            "new_letters": len(letters),
            "message": f"Получено новых писем: {len(letters)}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при проверке почты: {str(e)}")


@mail_router.get("/status", response_model=dict)
def get_mail_status():
    """Статус подключения к почте"""
    return mail_service.get_status()
