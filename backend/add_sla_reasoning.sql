-- Добавление поля sla_reasoning для хранения объяснения выбора SLA
-- Дата: 2025-11-29

ALTER TABLE letters 
ADD COLUMN IF NOT EXISTS sla_reasoning TEXT;

-- Комментарий к колонке
COMMENT ON COLUMN letters.sla_reasoning IS 'Объяснение от AI почему выбран именно этот SLA';
