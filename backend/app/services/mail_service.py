import email
import logging
import re
import asyncio
from email.header import decode_header
from typing import List, Optional
from datetime import datetime
from imapclient import IMAPClient
from html2text import HTML2Text
from sqlalchemy.orm import Session

from app.models import Letter, LetterType, LetterStatus
from app.config import settings

logger = logging.getLogger(__name__)


class YandexMailService:
    """Сервис для работы с Яндекс Почтой через IMAP"""
    
    def __init__(self):
        self.client: Optional[IMAPClient] = None
        self.html_converter = HTML2Text()
        self.html_converter.ignore_links = False
        self.html_converter.body_width = 0
        
    def connect(self) -> bool:
        """Подключение к Яндекс Почте"""
        try:
            if not settings.yandex_mail_login or not settings.yandex_mail_password:
                logger.warning("⚠️ Настройки почты не заданы")
                return False
            
            self.client = IMAPClient(
                host=settings.yandex_mail_imap_server,
                port=settings.yandex_mail_imap_port,
                ssl=True,
                timeout=30
            )
            
            self.client.login(
                settings.yandex_mail_login,
                settings.yandex_mail_password
            )
            
            logger.info(f"✅ Успешное подключение к {settings.yandex_mail_login}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Ошибка подключения к почте: {e}")
            self.client = None
            return False
    
    def disconnect(self):
        """Отключение от почты"""
        if self.client:
            try:
                self.client.logout()
                logger.info("🔌 Отключение от почты")
            except:
                pass
            finally:
                self.client = None
    
    def _decode_header(self, header_value: str) -> str:
        """Декодирование заголовка письма"""
        if not header_value:
            return ""
        
        decoded_parts = []
        for part, encoding in decode_header(header_value):
            if isinstance(part, bytes):
                try:
                    decoded_parts.append(part.decode(encoding or 'utf-8', errors='ignore'))
                except:
                    decoded_parts.append(part.decode('utf-8', errors='ignore'))
            else:
                decoded_parts.append(part)
        
        return ''.join(decoded_parts)
    
    def _extract_email(self, email_str: str) -> tuple[str, str]:
        """Извлечение имени и email из строки 'Name <email@domain>'"""
        match = re.search(r'(.+?)\s*<(.+?)>', email_str)
        if match:
            return match.group(1).strip(), match.group(2).strip()
        return email_str.strip(), email_str.strip()
    
    def _get_email_body(self, msg: email.message.Message) -> str:
        """Извлечение текста письма"""
        body = ""
        
        if msg.is_multipart():
            for part in msg.walk():
                content_type = part.get_content_type()
                disposition = str(part.get('Content-Disposition', ''))
                
                if 'attachment' in disposition:
                    continue
                
                try:
                    if content_type == 'text/plain':
                        payload = part.get_payload(decode=True)
                        if payload:
                            charset = part.get_content_charset() or 'utf-8'
                            body = payload.decode(charset, errors='ignore')
                            break
                    elif content_type == 'text/html' and not body:
                        payload = part.get_payload(decode=True)
                        if payload:
                            charset = part.get_content_charset() or 'utf-8'
                            html_content = payload.decode(charset, errors='ignore')
                            body = self.html_converter.handle(html_content)
                except Exception as e:
                    logger.error(f"Ошибка декодирования части: {e}")
                    continue
        else:
            content_type = msg.get_content_type()
            try:
                payload = msg.get_payload(decode=True)
                if payload:
                    charset = msg.get_content_charset() or 'utf-8'
                    if content_type == 'text/html':
                        html_content = payload.decode(charset, errors='ignore')
                        body = self.html_converter.handle(html_content)
                    else:
                        body = payload.decode(charset, errors='ignore')
            except Exception as e:
                logger.error(f"Ошибка декодирования: {e}")
        
        return body.strip()
    
    def fetch_new_emails(self, db: Session, mailbox: str = 'INBOX') -> List[Letter]:
        """Получение новых непрочитанных писем (синхронный метод)"""
        if not self.client:
            if not self.connect():
                return []
        
        try:
            self.client.select_folder(mailbox)
            
            # Ищем непрочитанные письма
            messages = self.client.search(['UNSEEN'])
            
            if not messages:
                logger.info("Новых писем нет")
                return []
            
            logger.info(f"📧 Найдено новых писем: {len(messages)}")
            
            created_letters = []
            
            # Получаем письма пачкой
            response = self.client.fetch(messages, ['RFC822'])
            
            for msg_id, data in response.items():
                try:
                    raw_email = data[b'RFC822']
                    msg = email.message_from_bytes(raw_email)
                    
                    # Извлекаем данные
                    subject = self._decode_header(msg.get('Subject', 'Без темы'))
                    from_header = self._decode_header(msg.get('From', ''))
                    sender_name, sender_email = self._extract_email(from_header)
                    body = self._get_email_body(msg)
                    
                    # Проверяем дубликаты
                    existing = db.query(Letter).filter(
                        Letter.subject == subject,
                        Letter.sender_email == sender_email
                    ).first()
                    
                    if existing:
                        logger.info(f"Письмо уже существует: {subject[:50]}...")
                        continue
                    
                    # Создаем письмо
                    letter = Letter(
                        subject=subject,
                        body=body,
                        sender_name=sender_name,
                        sender_email=sender_email,
                        letter_type=LetterType.OTHER,  # Тип по умолчанию, AI определит позже
                        status=LetterStatus.NEW,
                        priority=3
                    )
                    
                    db.add(letter)
                    db.commit()
                    db.refresh(letter)
                    
                    created_letters.append(letter)
                    logger.info(f"✅ Создано письмо #{letter.id}: {subject[:50]}...")
                    
                except Exception as e:
                    logger.error(f"Ошибка обработки письма {msg_id}: {e}")
                    db.rollback()
                    continue
            
            return created_letters
            
        except Exception as e:
            logger.error(f"❌ Ошибка получения писем: {e}")
            return []
    
    def get_status(self) -> dict:
        """Получить статус подключения"""
        if not self.client:
            return {
                "connected": False,
                "email": settings.yandex_mail_login or "Не настроено"
            }
        
        try:
            # Проверка соединения
            self.client.noop()
            return {
                "connected": True,
                "email": settings.yandex_mail_login,
                "server": f"{settings.yandex_mail_imap_server}:{settings.yandex_mail_imap_port}"
            }
        except:
            return {
                "connected": False,
                "email": settings.yandex_mail_login
            }


# Глобальный экземпляр сервиса
mail_service = YandexMailService()


async def start_mail_monitoring(db_session_factory):
    """Фоновая задача мониторинга почты"""
    logger.info("🚀 Запуск мониторинга почты...")
    
    while True:
        try:
            # Создаем новую сессию БД для каждой проверки
            db = next(db_session_factory())
            
            try:
                # Синхронный вызов в async контексте
                await asyncio.to_thread(mail_service.fetch_new_emails, db)
            finally:
                db.close()
            
            # Ожидание до следующей проверки
            await asyncio.sleep(settings.yandex_mail_check_interval)
            
        except Exception as e:
            logger.error(f"❌ Ошибка мониторинга: {e}")
            await asyncio.sleep(60)
