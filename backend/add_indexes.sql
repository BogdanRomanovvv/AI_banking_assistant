-- Добавление индексов для оптимизации запросов

-- Индекс на статус письма
CREATE INDEX IF NOT EXISTS idx_letters_status ON letters(status);

-- Индекс на дату создания для сортировки
CREATE INDEX IF NOT EXISTS idx_letters_created_at ON letters(created_at DESC);

-- Составной индекс для частого запроса (статус + дата)
CREATE INDEX IF NOT EXISTS idx_letters_status_created ON letters(status, created_at DESC);

-- Индекс для поиска по current_approver
CREATE INDEX IF NOT EXISTS idx_letters_current_approver ON letters(current_approver);
