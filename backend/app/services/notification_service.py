"""
Сервис для работы с уведомлениями
"""
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from app.models import Notification, NotificationType, User, Letter
from app.schemas import NotificationCreate, NotificationResponse
import logging

logger = logging.getLogger(__name__)


def create_notification(
    db: Session,
    user_id: int,
    notification_type: NotificationType,
    title: str,
    message: str,
    letter_id: Optional[int] = None
) -> Notification:
    """Создать новое уведомление"""
    try:
        notification = Notification(
            user_id=user_id,
            letter_id=letter_id,
            type=notification_type,
            title=title,
            message=message,
            is_read=False
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        logger.info(f"Создано уведомление {notification.id} для пользователя {user_id}")
        return notification
    except Exception as e:
        logger.error(f"Ошибка создания уведомления: {e}")
        db.rollback()
        raise


def get_user_notifications(
    db: Session,
    user_id: int,
    limit: int = 50,
    only_unread: bool = False
) -> List[Notification]:
    """Получить уведомления пользователя"""
    query = db.query(Notification).filter(Notification.user_id == user_id)
    
    if only_unread:
        query = query.filter(Notification.is_read == False)
    
    return query.order_by(Notification.created_at.desc()).limit(limit).all()


def get_unread_count(db: Session, user_id: int) -> int:
    """Получить количество непрочитанных уведомлений"""
    return db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False
    ).count()


def mark_as_read(db: Session, notification_id: int, user_id: int) -> Optional[Notification]:
    """Пометить уведомление как прочитанное"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user_id
    ).first()
    
    if notification:
        notification.is_read = True
        db.commit()
        db.refresh(notification)
        logger.info(f"Уведомление {notification_id} помечено как прочитанное")
    
    return notification


def mark_all_as_read(db: Session, user_id: int) -> int:
    """Пометить все уведомления как прочитанные"""
    count = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False
    ).update({"is_read": True})
    
    db.commit()
    logger.info(f"Помечено как прочитанные {count} уведомлений для пользователя {user_id}")
    return count


def delete_notification(db: Session, notification_id: int, user_id: int) -> bool:
    """Удалить уведомление"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user_id
    ).first()
    
    if notification:
        db.delete(notification)
        db.commit()
        logger.info(f"Уведомление {notification_id} удалено")
        return True
    
    return False


def notify_letter_assigned(db: Session, letter: Letter, approver_role: str):
    """Уведомление о назначении письма на согласование"""
    # Найти всех пользователей с нужной ролью
    approvers = db.query(User).filter(
        User.role == approver_role,
        User.is_active == True
    ).all()
    
    for approver in approvers:
        create_notification(
            db=db,
            user_id=approver.id,
            notification_type=NotificationType.LETTER_ASSIGNED,
            title="Новое письмо на согласовании",
            message=f"Письмо #{letter.id} '{letter.subject}' ожидает вашего согласования",
            letter_id=letter.id
        )


def notify_letter_approved(db: Session, letter: Letter, operator_username: str):
    """Уведомление об согласовании письма"""
    # Найти оператора, который создал письмо или работал с ним
    # Предполагаем, что letter имеет связь с пользователем или мы ищем по username
    operator = db.query(User).filter(User.username == operator_username).first()
    
    if operator:
        create_notification(
            db=db,
            user_id=operator.id,
            notification_type=NotificationType.LETTER_APPROVED,
            title="Письмо согласовано",
            message=f"Письмо #{letter.id} '{letter.subject}' успешно согласовано",
            letter_id=letter.id
        )


def notify_letter_rejected(db: Session, letter: Letter, operator_username: str, reason: str):
    """Уведомление об отклонении письма"""
    operator = db.query(User).filter(User.username == operator_username).first()
    
    if operator:
        create_notification(
            db=db,
            user_id=operator.id,
            notification_type=NotificationType.LETTER_REJECTED,
            title="Письмо отклонено",
            message=f"Письмо #{letter.id} '{letter.subject}' отклонено. Причина: {reason}",
            letter_id=letter.id
        )


def notify_sla_warning(db: Session, letter: Letter, hours_left: float):
    """Предупреждение о приближающемся дедлайне"""
    # Уведомляем всех операторов и администраторов
    users = db.query(User).filter(
        User.role.in_(["operator", "admin"]),
        User.is_active == True
    ).all()
    
    for user in users:
        create_notification(
            db=db,
            user_id=user.id,
            notification_type=NotificationType.SLA_WARNING,
            title="Внимание: приближается дедлайн",
            message=f"До дедлайна письма #{letter.id} '{letter.subject}' осталось {hours_left:.1f} ч",
            letter_id=letter.id
        )


def notify_sla_expired(db: Session, letter: Letter):
    """Уведомление о просроченном SLA"""
    # Уведомляем всех операторов и администраторов
    users = db.query(User).filter(
        User.role.in_(["operator", "admin"]),
        User.is_active == True
    ).all()
    
    for user in users:
        create_notification(
            db=db,
            user_id=user.id,
            notification_type=NotificationType.SLA_EXPIRED,
            title="SLA просрочен!",
            message=f"Дедлайн письма #{letter.id} '{letter.subject}' истёк!",
            letter_id=letter.id
        )


def cleanup_old_notifications(db: Session, days: int = 30):
    """Удалить старые прочитанные уведомления"""
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    count = db.query(Notification).filter(
        Notification.is_read == True,
        Notification.created_at < cutoff_date
    ).delete()
    
    db.commit()
    logger.info(f"Удалено {count} старых уведомлений (старше {days} дней)")
    return count
