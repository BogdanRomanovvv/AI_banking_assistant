from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
import logging

from app.api.routes import router as letters_router, mail_router, user_router, auth_router
from app.database import engine, Base, get_db
from app.services.mail_service import start_mail_monitoring
from app.services.priority_service import recalculate_priorities

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Создание таблиц
Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Управление жизненным циклом приложения"""
    # Запуск фоновых задач
    mail_task = asyncio.create_task(start_mail_monitoring(get_db))
    priority_task = asyncio.create_task(recalculate_priorities(get_db))
    logging.info("✅ Приложение запущено, мониторинг почты активен")
    
    yield
    
    # Остановка фоновых задач
    mail_task.cancel()
    priority_task.cancel()
    logging.info("⏸️ Приложение остановлено")


app = FastAPI(
    title="Banking AI Assistant",
    description="AI-powered system for corporate correspondence processing",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение роутов
app.include_router(auth_router)
app.include_router(letters_router)
app.include_router(mail_router)
app.include_router(user_router)


@app.get("/")
def root():
    return {"message": "Banking AI Assistant API", "status": "running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
