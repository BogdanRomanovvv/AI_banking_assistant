"""
Сервис мониторинга SLA и создания уведомлений
"""
import asyncio
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models import Letter, LetterStatus
from app.services import notification_service

logger = logging.getLogger(__name__)

# Время предупреждения (в часах до дедлайна)
WARNING_HOURS_BEFORE = 2


async def monitor_sla(get_db_func):
    """
    Периодическая проверка SLA писем и создание уведомлений
    Запускается каждые 5 минут
    """
    logger.info("🔔 Запущен мониторинг SLA")
    
    while True:
        try:
            # Создаем новую сессию
            db: Session = next(get_db_func())
            
            try:
                # Получаем все активные письма (не закрытые)
                active_letters = db.query(Letter).filter(
                    Letter.status.in_([
                        LetterStatus.NEW,
                        LetterStatus.ANALYZING,
                        LetterStatus.IN_PROGRESS,
                        LetterStatus.DRAFT_READY,
                        LetterStatus.IN_APPROVAL
                    ]),
                    Letter.deadline.isnot(None),
                    Letter.sla_hours.isnot(None),
                    Letter.sla_hours > 0  # Исключаем уведомления (sla_hours = 0)
                ).all()
                
                now = datetime.utcnow()
                
                for letter in active_letters:
                    if not letter.deadline:
                        continue
                    
                    # Вычисляем время до дедлайна (обе даты должны быть в UTC)
                    time_left = letter.deadline.replace(tzinfo=None) - now
                    hours_left = time_left.total_seconds() / 3600
                    
                    # Проверяем, нужно ли создать уведомление
                    if hours_left <= 0:
                        # SLA просрочен
                        # Проверяем, не создавали ли уже уведомление
                        existing_expired = db.query(notification_service.Notification).filter(
                            notification_service.Notification.letter_id == letter.id,
                            notification_service.Notification.type == notification_service.NotificationType.SLA_EXPIRED
                        ).first()
                        
                        if not existing_expired:
                            logger.warning(f"⚠️ SLA просрочен для письма #{letter.id}")
                            notification_service.notify_sla_expired(db, letter)
                    
                    elif hours_left <= WARNING_HOURS_BEFORE:
                        # Приближается дедлайн
                        # Проверяем, не создавали ли уже предупреждение
                        existing_warning = db.query(notification_service.Notification).filter(
                            notification_service.Notification.letter_id == letter.id,
                            notification_service.Notification.type == notification_service.NotificationType.SLA_WARNING
                        ).first()
                        
                        if not existing_warning:
                            logger.info(f"⏰ Приближается дедлайн для письма #{letter.id}: {hours_left:.1f}ч")
                            notification_service.notify_sla_warning(db, letter, hours_left)
                
                logger.info(f"✅ SLA проверка завершена: проверено {len(active_letters)} писем")
                
            finally:
                db.close()
            
            # Ждем 5 минут до следующей проверки
            await asyncio.sleep(5 * 60)  # 300 секунд
            
        except Exception as e:
            logger.error(f"❌ Ошибка в мониторинге SLA: {e}")
            await asyncio.sleep(60)  # При ошибке ждем 1 минуту и пробуем снова
