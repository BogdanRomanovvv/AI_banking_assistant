import logging
import asyncio
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models import Letter, LetterStatus

logger = logging.getLogger(__name__)


def _calc_priority(letter: Letter) -> int:
    """Рассчитывает приоритет (1..3) на основании дедлайна и SLA.

    Правила:
    - Просрочено или осталось <= 4 ч -> 1 (высокий)
    - Если осталось < 20% SLA -> 1 (высокий)
    - Если осталось < 50% SLA -> 2 (средний)
    - Иначе -> 3 (низкий)
    """
    if not letter.deadline:
        return letter.priority or 2

    now = datetime.now(tz=letter.deadline.tzinfo) if letter.deadline.tzinfo else datetime.now()
    hours_left = (letter.deadline - now).total_seconds() / 3600.0

    if hours_left <= 0:
        return 1
    if hours_left <= 4:
        return 1

    sla = letter.sla_hours or 24
    # защита от нулевого/отрицательного SLA
    if sla <= 0:
        sla = 24

    ratio = hours_left / float(sla)
    if ratio < 0.2:
        return 1
    if ratio < 0.5:
        return 2
    return 3


async def recalculate_priorities(db_session_factory, interval_seconds: int = 300):
    """Фоновая задача периодического пересчёта приоритетов.

    По умолчанию каждые 5 минут. Обновляет письма не в финальных статусах.
    """
    logger.info("🕒 Запущен пересчет приоритетов")
    while True:
        try:
            db: Session = next(db_session_factory())
            try:
                letters = (
                    db.query(Letter)
                    .filter(Letter.deadline.isnot(None))
                    .filter(Letter.status.notin_([LetterStatus.APPROVED, LetterStatus.SENT]))
                    .all()
                )

                changed = 0
                for letter in letters:
                    new_pr = _calc_priority(letter)
                    if new_pr != (letter.priority or 2):
                        letter.priority = new_pr
                        changed += 1

                if changed:
                    db.commit()
                    logger.info(f"⬆️ Обновлены приоритеты у {changed} писем")
            finally:
                db.close()

            await asyncio.sleep(interval_seconds)
        except Exception as e:
            logger.error(f"❌ Ошибка пересчёта приоритетов: {e}")
            await asyncio.sleep(interval_seconds)
