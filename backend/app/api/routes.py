from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import timedelta
from app.database import get_db
from app.schemas import (
    LetterCreate, LetterResponse, LetterUpdate, 
    UserCreate, UserUpdate, UserResponse,
    Token, UserLogin, UserRegister
)
from app.services.letter_service import letter_service
from app.services.mail_service import mail_service
from app.models import LetterStatus, User
from app.auth import (
    get_password_hash, authenticate_user, create_access_token,
    get_current_active_user, require_admin, require_operator,
    require_approver, ACCESS_TOKEN_EXPIRE_MINUTES
)
from pydantic import BaseModel


router = APIRouter(prefix="/api/letters", tags=["letters"])
mail_router = APIRouter(prefix="/api/mail", tags=["mail"])
user_router = APIRouter(prefix="/api/users", tags=["users"])
auth_router = APIRouter(prefix="/api/auth", tags=["auth"])


# Auth endpoints
@auth_router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Регистрация нового пользователя"""
    # Проверка на существующий username
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Пользователь с таким username уже существует")
    
    # Проверка на существующий email
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Пользователь с таким email уже существует")
    
    # Создание пользователя
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        middle_name=user_data.middle_name,
        role=user_data.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@auth_router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Вход в систему"""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверное имя пользователя или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@auth_router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Получить информацию о текущем пользователе"""
    return current_user


# User endpoints (только для админов)
@user_router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user: UserCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Создание пользователя (только админ)"""
    # Проверка на существующий username
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Пользователь с таким username уже существует")
    
    # Проверка на существующий email
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Пользователь с таким email уже существует")
    
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name,
        middle_name=user.middle_name,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@user_router.get("/", response_model=List[UserResponse])
def get_users(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Получение списка пользователей"""
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@user_router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Получение пользователя по ID"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user


@user_router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int, 
    user_update: UserUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Обновление данных пользователя (только админ)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # Проверка на уникальность email при обновлении
    if user_update.email and user_update.email != user.email:
        existing_user = db.query(User).filter(User.email == user_update.email).first()
        if existing_user:
            raise HTTPException(
                status_code=400, 
                detail="Пользователь с таким email уже существует"
            )
    
    update_data = user_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    return user


@user_router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Удаление пользователя (только админ)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    db.delete(user)
    db.commit()
    return None


# Letter endpoints (требуют аутентификации)
@router.post("/", response_model=LetterResponse, status_code=status.HTTP_201_CREATED)
def create_letter(
    letter: LetterCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operator)
):
    """Создание нового письма (операторы и админы)"""
    return letter_service.create_letter(db, letter)


@router.get("/", response_model=List[LetterResponse])
def get_letters(
    skip: int = 0, 
    limit: int = 100, 
    status: Optional[LetterStatus] = None,
    reserved: Optional[bool] = None,  # Новый параметр для фильтрации зарезервированных
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Получение списка писем"""
    from app.models import UserRole
    import logging
    logger = logging.getLogger(__name__)
    
    # Для согласующих (юристы и маркетологи) - только письма на согласовании у них
    if current_user.role in [UserRole.LAWYER, UserRole.MARKETING]:
        role_department_map = {
            UserRole.LAWYER: 'Юридический отдел',
            UserRole.MARKETING: 'Отдел маркетинга'
        }
        department = role_department_map.get(current_user.role)
        
        logger.info(f"Approver request: role={current_user.role}, dept={department}, status={status}, reserved={reserved}, user_id={current_user.id}")
        
        # Фильтрация на уровне SQL с учетом резервирования
        result = letter_service.get_letters(
            db, skip, limit, status, 
            department_filter=department,
            user_id=current_user.id,
            reserved_filter=reserved
        )
        
        logger.info(f"Approver result: {len(result)} letters found")
        return result
    
    # Для операторов и админов - все письма
    return letter_service.get_letters(db, skip, limit, status)


@router.get("/{letter_id}", response_model=LetterResponse)
def get_letter(
    letter_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Получение письма по ID"""
    letter = letter_service.get_letter(db, letter_id)
    if not letter:
        raise HTTPException(status_code=404, detail="Letter not found")
    return letter


@router.post("/{letter_id}/analyze", response_model=LetterResponse)
async def analyze_letter(
    letter_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operator)
):
    """Анализ письма через AI (операторы и админы)"""
    try:
        return await letter_service.analyze_letter(db, letter_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/{letter_id}", response_model=LetterResponse)
def update_letter(
    letter_id: int, 
    letter_update: LetterUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operator)
):
    """Обновление письма (операторы и админы)"""
    try:
        return letter_service.update_letter(db, letter_id, letter_update)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{letter_id}/approval/start", response_model=LetterResponse)
def start_approval(
    letter_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operator)
):
    """Начать процесс согласования (операторы и админы)"""
    try:
        return letter_service.start_approval(db, letter_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{letter_id}/reserve", response_model=LetterResponse)
def reserve_letter(
    letter_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_approver)
):
    """Резервирование письма за согласующим (юристы, маркетологи)"""
    try:
        return letter_service.reserve_letter(db, letter_id, current_user.id)
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
    db: Session = Depends(get_db),
    current_user: User = Depends(require_approver)
):
    """Добавление комментария от согласующего (юристы, бухгалтеры, менеджеры, комплаенс, админы)"""
    from app.models import UserRole
    
    # Проверяем, что пользователь согласовывает письмо своего отдела
    if current_user.role != UserRole.ADMIN:
        role_department_map = {
            UserRole.LAWYER: 'Юридический отдел',
            UserRole.MARKETING: 'Отдел маркетинга'
        }
        user_department = role_department_map.get(current_user.role)
        
        # Сравниваем названия отделов без учета регистра
        if comment_data.department.lower() != user_department.lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Вы можете согласовывать только письма отдела '{user_department}'"
            )
    
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
