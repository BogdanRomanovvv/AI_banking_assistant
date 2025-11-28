import logging
import smtplib
from email.message import EmailMessage
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)


def send_email(to_email: str, subject: str, body: str, reply_to: Optional[str] = None) -> bool:
    """Отправка письма через SMTP Яндекса.

    Возвращает True при успехе, False при ошибке.
    """
    if not settings.yandex_mail_login or not settings.yandex_mail_password:
        logger.warning("⚠️ Невозможно отправить письмо: не заданы YANDEX_MAIL_LOGIN/PASSWORD")
        return False

    msg = EmailMessage()
    msg["From"] = settings.yandex_mail_login
    msg["To"] = to_email
    msg["Subject"] = subject
    if reply_to:
        msg["Reply-To"] = reply_to
    msg.set_content(body)

    try:
        if settings.yandex_mail_smtp_use_ssl:
            with smtplib.SMTP_SSL(settings.yandex_mail_smtp_server, settings.yandex_mail_smtp_port) as server:
                server.login(settings.yandex_mail_login, settings.yandex_mail_password)
                server.send_message(msg)
        else:
            with smtplib.SMTP(settings.yandex_mail_smtp_server, settings.yandex_mail_smtp_port) as server:
                server.starttls()
                server.login(settings.yandex_mail_login, settings.yandex_mail_password)
                server.send_message(msg)
        logger.info(f"📤 Исходящее письмо отправлено на {to_email}")
        return True
    except Exception as e:
        logger.error(f"❌ Ошибка отправки письма на {to_email}: {e}")
        return False
