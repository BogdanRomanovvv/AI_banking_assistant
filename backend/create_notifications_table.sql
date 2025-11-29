-- Создание таблицы notifications для системы уведомлений
-- Дата: 29 ноября 2025 г.

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    letter_id INTEGER,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_letter_id ON notifications(letter_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Комментарии
COMMENT ON TABLE notifications IS 'Уведомления пользователей о событиях в системе';
COMMENT ON COLUMN notifications.type IS 'Тип уведомления: letter_assigned, letter_approved, letter_rejected, sla_warning, sla_expired';
COMMENT ON COLUMN notifications.user_id IS 'ID пользователя-получателя';
COMMENT ON COLUMN notifications.letter_id IS 'ID связанного письма (опционально)';
