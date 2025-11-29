from sqlalchemy.orm import Session
from sqlalchemy import func, case, extract
from app.models import Letter, LetterStatus, LetterType
from datetime import datetime, timedelta
from typing import Dict, List, Any


class AnalyticsService:
    """Сервис для аналитики и статистики по письмам"""
    
    @staticmethod
    def get_processing_time_metrics(db: Session, days: int = 30) -> Dict[str, Any]:
            """Метрики времени обработки писем"""
            from logging import getLogger
            logger = getLogger("analytics")
            cutoff_date = datetime.now() - timedelta(days=days)
            try:
                # Считаем обработанными письма со статусами SENT и APPROVED
                processed_letters = db.query(Letter).filter(
                    Letter.status.in_([LetterStatus.SENT, LetterStatus.APPROVED]),
                    Letter.created_at >= cutoff_date
                ).all()
                if not processed_letters:
                    return {
                        "average_response_time_hours": 0,
                        "median_response_time_hours": 0,
                        "min_response_time_hours": 0,
                        "max_response_time_hours": 0,
                        "total_processed": 0
                    }
                processing_times = []
                for letter in processed_letters:
                    if letter.updated_at is not None and letter.created_at is not None:
                        try:
                            time_diff = (letter.updated_at - letter.created_at).total_seconds() / 3600
                            if time_diff >= 0:
                                processing_times.append(time_diff)
                        except Exception as e:
                            logger.warning(f"Ошибка расчета времени для письма {letter.id}: {e}")
                processing_times.sort()
                return {
                    "average_response_time_hours": round(sum(processing_times) / len(processing_times), 2) if processing_times else 0,
                    "median_response_time_hours": round(processing_times[len(processing_times) // 2], 2) if processing_times else 0,
                    "min_response_time_hours": round(min(processing_times), 2) if processing_times else 0,
                    "max_response_time_hours": round(max(processing_times), 2) if processing_times else 0,
                    "total_processed": len(processing_times)
                }
            except Exception as e:
                logger.error(f"Ошибка аналитики времени обработки: {e}")
                return {
                    "average_response_time_hours": 0,
                    "median_response_time_hours": 0,
                    "min_response_time_hours": 0,
                    "max_response_time_hours": 0,
                    "total_processed": 0,
                    "error": str(e)
                }
    
    @staticmethod
    def get_sla_compliance(db: Session, days: int = 30) -> Dict[str, Any]:
        """Анализ соблюдения SLA"""
        cutoff_date = datetime.now() - timedelta(days=days)
        
        # Все письма с дедлайном
        letters_with_deadline = db.query(Letter).filter(
            Letter.deadline.isnot(None),
            Letter.created_at >= cutoff_date
        ).all()
        
        if not letters_with_deadline:
            return {
                "total_with_sla": 0,
                "met_sla": 0,
                "missed_sla": 0,
                "compliance_rate": 0,
                "average_sla_deviation_hours": 0
            }
        
        met_sla = 0
        missed_sla = 0
        deviations = []
        
        for letter in letters_with_deadline:
            completion_time = letter.updated_at or datetime.now()
            
            if completion_time <= letter.deadline:
                met_sla += 1
                deviation = (letter.deadline - completion_time).total_seconds() / 3600
                deviations.append(deviation)
            else:
                missed_sla += 1
                deviation = (completion_time - letter.deadline).total_seconds() / 3600
                deviations.append(-deviation)
        
        total = len(letters_with_deadline)
        compliance_rate = (met_sla / total * 100) if total > 0 else 0
        avg_deviation = sum(deviations) / len(deviations) if deviations else 0
        
        return {
            "total_with_sla": total,
            "met_sla": met_sla,
            "missed_sla": missed_sla,
            "compliance_rate": round(compliance_rate, 2),
            "average_sla_deviation_hours": round(avg_deviation, 2)
        }
    
    @staticmethod
    def get_letter_type_distribution(db: Session, days: int = 30) -> List[Dict[str, Any]]:
        """Статистика по типам корреспонденции"""
        cutoff_date = datetime.now() - timedelta(days=days)
        
        # Группировка по типам писем
        type_stats = db.query(
            Letter.letter_type,
            func.count(Letter.id).label('count')
        ).filter(
            Letter.created_at >= cutoff_date
        ).group_by(
            Letter.letter_type
        ).all()
        
        total = sum(stat.count for stat in type_stats)
        
        result = []
        for stat in type_stats:
            letter_type = stat.letter_type.value if stat.letter_type else 'unknown'
            count = stat.count
            percentage = (count / total * 100) if total > 0 else 0
            
            result.append({
                "type": letter_type,
                "count": count,
                "percentage": round(percentage, 2)
            })
        
        return sorted(result, key=lambda x: x['count'], reverse=True)
    
    @staticmethod
    def get_status_distribution(db: Session) -> List[Dict[str, Any]]:
        """Распределение писем по статусам"""
        status_stats = db.query(
            Letter.status,
            func.count(Letter.id).label('count')
        ).group_by(
            Letter.status
        ).all()
        
        total = sum(stat.count for stat in status_stats)
        
        result = []
        for stat in status_stats:
            status = stat.status.value if stat.status else 'unknown'
            count = stat.count
            percentage = (count / total * 100) if total > 0 else 0
            
            result.append({
                "status": status,
                "count": count,
                "percentage": round(percentage, 2)
            })
        
        return result
    
    @staticmethod
    def get_priority_distribution(db: Session, days: int = 30) -> List[Dict[str, Any]]:
        """Распределение по приоритетам"""
        cutoff_date = datetime.now() - timedelta(days=days)
        
        priority_stats = db.query(
            Letter.priority,
            func.count(Letter.id).label('count')
        ).filter(
            Letter.created_at >= cutoff_date
        ).group_by(
            Letter.priority
        ).all()
        
        priority_labels = {
            1: 'Высокий',
            2: 'Средний',
            3: 'Низкий'
        }
        
        total = sum(stat.count for stat in priority_stats)
        
        result = []
        for stat in priority_stats:
            priority = stat.priority
            count = stat.count
            percentage = (count / total * 100) if total > 0 else 0
            
            result.append({
                "priority": priority,
                "priority_label": priority_labels.get(priority, 'Неизвестно'),
                "count": count,
                "percentage": round(percentage, 2)
            })
        
        return sorted(result, key=lambda x: x['priority'])
    
    @staticmethod
    def get_daily_statistics(db: Session, days: int = 30) -> List[Dict[str, Any]]:
        """Ежедневная статистика поступления писем"""
        cutoff_date = datetime.now() - timedelta(days=days)
        
        daily_stats = db.query(
            func.date(Letter.created_at).label('date'),
            func.count(Letter.id).label('count')
        ).filter(
            Letter.created_at >= cutoff_date
        ).group_by(
            func.date(Letter.created_at)
        ).order_by(
            func.date(Letter.created_at)
        ).all()
        
        result = []
        for stat in daily_stats:
            result.append({
                "date": stat.date.isoformat(),
                "count": stat.count
            })
        
        return result
    
    @staticmethod
    def get_department_workload(db: Session, days: int = 30) -> List[Dict[str, Any]]:
        """Нагрузка по отделам (согласование)"""
        cutoff_date = datetime.now() - timedelta(days=days)
        
        # Получаем все письма, которые требовали согласования
        letters = db.query(Letter).filter(
            Letter.approval_route.isnot(None),
            Letter.created_at >= cutoff_date
        ).all()
        
        department_counts = {}
        
        for letter in letters:
            if letter.approval_route:
                for route in letter.approval_route:
                    dept = route.get('department', 'Unknown')
                    department_counts[dept] = department_counts.get(dept, 0) + 1
        
        result = []
        for dept, count in department_counts.items():
            result.append({
                "department": dept,
                "count": count
            })
        
        return sorted(result, key=lambda x: x['count'], reverse=True)
    
    @staticmethod
    def get_overall_summary(db: Session, days: int = 30) -> Dict[str, Any]:
        """Общая сводка по системе"""
        cutoff_date = datetime.now() - timedelta(days=days)
        
        total_letters = db.query(func.count(Letter.id)).filter(
            Letter.created_at >= cutoff_date
        ).scalar()
        
        processed_letters = db.query(func.count(Letter.id)).filter(
            Letter.status.in_([LetterStatus.SENT, LetterStatus.APPROVED]),
            Letter.created_at >= cutoff_date
        ).scalar()
        
        in_progress = db.query(func.count(Letter.id)).filter(
            Letter.status.in_([LetterStatus.NEW, LetterStatus.IN_PROGRESS, LetterStatus.ANALYZING]),
            Letter.created_at >= cutoff_date
        ).scalar()
        
        avg_sla = db.query(func.avg(Letter.sla_hours)).filter(
            Letter.sla_hours.isnot(None),
            Letter.created_at >= cutoff_date
        ).scalar()
        
        return {
            "total_letters": total_letters or 0,
            "processed_letters": processed_letters or 0,
            "in_progress": in_progress or 0,
            "average_sla_hours": round(float(avg_sla), 2) if avg_sla else 0,
            "processing_rate": round((processed_letters / total_letters * 100), 2) if total_letters > 0 else 0
        }


analytics_service = AnalyticsService()
