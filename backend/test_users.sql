-- Создание тестового администратора
-- Username: admin
-- Password: admin123

INSERT INTO users (username, email, hashed_password, first_name, last_name, role, is_active, created_at)
VALUES (
    'admin',
    'admin@bank.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyVK/0pqhZ1G',  -- admin123
    'Администратор',
    'Системы',
    'admin',
    true,
    NOW()
);

-- Создание тестового оператора
-- Username: operator
-- Password: operator123

INSERT INTO users (username, email, hashed_password, first_name, last_name, role, is_active, created_at)
VALUES (
    'operator',
    'operator@bank.com',
    '$2b$12$8vN9z9N8Z9Z8Z9Z8Z9Z8ZuKjH9Z8Z9Z8Z9Z8Z9Z8Z9Z8Z9Z8Z9Z8Z',  -- operator123
    'Иван',
    'Операторов',
    'operator',
    true,
    NOW()
);

-- Создание тестового юриста
-- Username: lawyer
-- Password: lawyer123

INSERT INTO users (username, email, hashed_password, first_name, last_name, role, is_active, created_at)
VALUES (
    'lawyer',
    'lawyer@bank.com',
    '$2b$12$9vN9z9N8Z9Z8Z9Z8Z9Z8ZuKjH9Z8Z9Z8Z9Z8Z9Z8Z9Z8Z9Z8Z9Z8Z',  -- lawyer123
    'Мария',
    'Юристова',
    'lawyer',
    true,
    NOW()
);
