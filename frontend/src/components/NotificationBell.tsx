import React, { useState, useEffect } from 'react';
import { Notification, NotificationType } from '../types';
import { notificationService } from '../services/api';

interface NotificationBellProps {
    onNotificationClick?: (letterId?: number) => void;
}

// Компонент иконки колокольчика (рисуем сами)
const BellIcon: React.FC<{ className?: string; hasUnread?: boolean }> = ({ className, hasUnread }) => (
    <svg
        className={className}
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        {/* Основание колокольчика */}
        <path
            d="M12 4C10.3431 4 9 5.34315 9 7V7.5C9 10.5 7.5 12.5 6 14H18C16.5 12.5 15 10.5 15 7.5V7C15 5.34315 13.6569 4 12 4Z"
            fill="currentColor"
            opacity="0.2"
        />
        {/* Контур колокольчика */}
        <path
            d="M15 7C15 5.34315 13.6569 4 12 4C10.3431 4 9 5.34315 9 7V7.5C9 10.5 7.5 12.5 6 14H18C16.5 12.5 15 10.5 15 7.5V7Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        {/* Язычок внизу */}
        <path
            d="M10 14V14.5C10 15.6046 10.8954 16.5 12 16.5C13.1046 16.5 14 15.6046 14 14.5V14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
        />
        {/* Верхняя петелька */}
        <circle
            cx="12"
            cy="3"
            r="1"
            stroke="currentColor"
            strokeWidth="1.5"
        />
        {/* Анимированные волны при непрочитанных */}
        {hasUnread && (
            <>
                <path
                    d="M17 8C18 8 19 7 19 6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    className="bell-wave"
                />
                <path
                    d="M7 8C6 8 5 7 5 6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    className="bell-wave"
                    style={{ animationDelay: '0.1s' }}
                />
            </>
        )}
    </svg>
);

export const NotificationBell: React.FC<NotificationBellProps> = ({ onNotificationClick }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Загрузка уведомлений
    const loadNotifications = async () => {
        try {
            const [notifs, count] = await Promise.all([
                notificationService.getNotifications(10, false),
                notificationService.getUnreadCount()
            ]);
            setNotifications(notifs);
            setUnreadCount(count);
        } catch (error) {
            console.error('Ошибка загрузки уведомлений:', error);
        }
    };

    // Polling каждые 30 секунд
    useEffect(() => {
        loadNotifications();
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Закрытие шторки при нажатии Escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            // Блокируем прокрутку body когда шторка открыта
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Пометить как прочитанное и открыть письмо
    const handleNotificationClick = async (notif: Notification) => {
        try {
            // Если еще не прочитано, помечаем как прочитанное
            if (!notif.is_read) {
                await notificationService.markAsRead(notif.id);
                // Обновляем локальное состояние
                setNotifications(prev => prev.map(n =>
                    n.id === notif.id ? { ...n, is_read: true } : n
                ));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }

            // Если есть связанное письмо, открываем его
            if (notif.letter_id && onNotificationClick) {
                onNotificationClick(notif.letter_id);
                setIsOpen(false);
            }
        } catch (error) {
            console.error('Ошибка обработки уведомления:', error);
        }
    };

    // Пометить все как прочитанные
    const handleMarkAllAsRead = async () => {
        if (loading || unreadCount === 0) return;

        try {
            setLoading(true);
            await notificationService.markAllAsRead();
            // Обновляем локальное состояние
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Ошибка пометки всех уведомлений:', error);
            // При ошибке перезагружаем данные
            await loadNotifications();
        } finally {
            setLoading(false);
        }
    };

    // Удалить уведомление
    const handleDelete = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const notification = notifications.find(n => n.id === id);
            await notificationService.deleteNotification(id);

            // Обновляем локальное состояние
            setNotifications(prev => prev.filter(n => n.id !== id));

            // Если удаленное уведомление было непрочитанным, уменьшаем счетчик
            if (notification && !notification.is_read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Ошибка удаления уведомления:', error);
        }
    };    // Иконка по типу уведомления
    const getNotificationIcon = (type: NotificationType) => {
        switch (type) {
            case NotificationType.LETTER_ASSIGNED:
                return '📨';
            case NotificationType.LETTER_APPROVED:
                return '✅';
            case NotificationType.LETTER_REJECTED:
                return '❌';
            case NotificationType.SLA_WARNING:
                return '⚠️';
            case NotificationType.SLA_EXPIRED:
                return '🔴';
            default:
                return '🔔';
        }
    };

    // Цвет по типу уведомления
    const getNotificationColor = (type: NotificationType) => {
        switch (type) {
            case NotificationType.SLA_EXPIRED:
                return 'var(--danger)';
            case NotificationType.SLA_WARNING:
                return 'var(--warning)';
            case NotificationType.LETTER_REJECTED:
                return 'var(--danger)';
            case NotificationType.LETTER_APPROVED:
                return 'var(--success)';
            default:
                return 'var(--primary)';
        }
    };

    // Форматирование времени
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Только что';
        if (diffMins < 60) return `${diffMins} мин назад`;
        if (diffHours < 24) return `${diffHours} ч назад`;
        if (diffDays < 7) return `${diffDays} д назад`;
        return date.toLocaleDateString('ru-RU');
    };

    return (
        <>
            {/* Кнопка колокольчика */}
            <button
                className="notification-bell-button"
                onClick={() => setIsOpen(!isOpen)}
                title="Уведомления"
                aria-label="Уведомления"
            >
                <BellIcon hasUnread={unreadCount > 0} />
                {unreadCount > 0 && (
                    <span className="notification-badge">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Оверлей (затемнение фона) */}
            {isOpen && (
                <div
                    className="notification-overlay"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Шторка с уведомлениями */}
            <div className={`notification-drawer ${isOpen ? 'open' : ''}`}>
                <div className="notification-drawer-header">
                    <h2>Уведомления</h2>
                    <button
                        className="notification-close"
                        onClick={() => setIsOpen(false)}
                        aria-label="Закрыть"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {unreadCount > 0 && (
                    <div className="notification-drawer-actions">
                        <button
                            className="btn-mark-all"
                            onClick={handleMarkAllAsRead}
                            disabled={loading}
                        >
                            {loading ? 'Загрузка...' : `Прочитать все (${unreadCount})`}
                        </button>
                    </div>
                )}

                <div className="notification-drawer-content">
                    {notifications.length === 0 ? (
                        <div className="notification-empty">
                            <BellIcon />
                            <p>Нет уведомлений</p>
                            <span>Здесь будут отображаться важные обновления</span>
                        </div>
                    ) : (
                        notifications.map(notif => (
                            <div
                                key={notif.id}
                                className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
                                onClick={() => handleNotificationClick(notif)}
                            >
                                <div
                                    className="notification-indicator"
                                    style={{ backgroundColor: getNotificationColor(notif.type) }}
                                />
                                <div className="notification-icon">
                                    {getNotificationIcon(notif.type)}
                                </div>
                                <div className="notification-content">
                                    <div className="notification-title">{notif.title}</div>
                                    <div className="notification-message">{notif.message}</div>
                                    <div className="notification-time">{formatTime(notif.created_at)}</div>
                                </div>
                                <button
                                    className="notification-delete"
                                    onClick={(e) => handleDelete(notif.id, e)}
                                    title="Удалить"
                                    aria-label="Удалить уведомление"
                                >
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="12" y1="4" x2="4" y2="12" />
                                        <line x1="4" y1="4" x2="12" y2="12" />
                                    </svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
};
