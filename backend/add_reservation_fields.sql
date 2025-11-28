-- Добавление полей для резервирования писем согласующими

ALTER TABLE letters 
ADD COLUMN IF NOT EXISTS reserved_by_user_id INTEGER,
ADD COLUMN IF NOT EXISTS reserved_at TIMESTAMP WITH TIME ZONE;

-- Индекс для быстрого поиска зарезервированных писем
CREATE INDEX IF NOT EXISTS idx_letters_reserved_by ON letters(reserved_by_user_id);

-- Индекс для составного поиска (зарезервировано + статус)
CREATE INDEX IF NOT EXISTS idx_letters_reserved_status ON letters(reserved_by_user_id, status);

COMMENT ON COLUMN letters.reserved_by_user_id IS 'ID пользователя, зарезервировавшего письмо для согласования';
COMMENT ON COLUMN letters.reserved_at IS 'Время резервирования письма';
