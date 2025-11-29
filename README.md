# Banking AI Assistant

AI-powered система автоматизации обработки деловой корреспонденции банка с использованием Yandex GPT.

## Описание

Banking AI Assistant — система для автоматической обработки входящих писем в банке. Использует искусственный интеллект (Yandex GPT) для:

- Автоматического анализа входящих писем
- Классификации типа обращения
- Определения SLA (Service Level Agreement)
- Генерации вариантов ответов
- Маршрутизации на согласование
- Аналитики и мониторинга

## Основные возможности

### Для операторов:
- Автоматический прием писем из почтового ящика
- AI-анализ с определением типа, приоритета, SLA
- 4 варианта ответа (строгий официальный, корпоративный, клиентоориентированный, краткий)
- Редактирование и доработка ответов
- Отправка на согласование

### Для согласующих (юристы, маркетологи):
- Отдельная доска с письмами на согласовании
- Резервирование писем (защита от одновременного редактирования)
- Согласование/отклонение с комментариями
- Быстрая обработка (автообновление каждые 5 секунд)

### Для администраторов:
- Управление пользователями
- Аналитика по обработке
- Мониторинг SLA
- Dashboard с метриками

### Система приоритетов:
- **Высокий (1)** - осталось < 4 часов или < 20% SLA
- **Средний (2)** - осталось < 50% SLA
- **Низкий (3)** - осталось >= 50% SLA
- Автоматический пересчет каждые 5 минут

### SLA (Service Level Agreement):
- **2 часа** - срочные (регуляторные запросы с пометкой "срочно", жалобы с угрозой суда)
- **4 часа** - высокий приоритет (госорганы, жалобы, корпоративные клиенты, СМИ)
- **24 часа** - стандартный (типовые запросы, справки, партнерские предложения)
- **72 часа** - обычный (коммерческие предложения, исследования)
- **0 часов** - уведомления (ответ не требуется)

## Архитектура

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│    Backend      │────▶│   Yandex GPT    │
│  React + TS     │     │    FastAPI      │     │   (AI Analysis) │
│  Vite + Nginx   │     │    Python 3.11  │     └─────────────────┘
└─────────────────┘     └─────────────────┘              │
         │                       │                        │
         │                       │                        ▼
         │                       ▼              ┌─────────────────┐
         │              ┌─────────────────┐    │  Knowledge Base │
         │              │  PostgreSQL 15  │    │     (JSON)      │
         │              │   (Database)    │    └─────────────────┘
         │              └─────────────────┘
         │                       │
         └───────────────────────┘
              Docker Network
```

### Stack технологий:

**Frontend:**
- React 18 + TypeScript
- Vite (bundler)
- CSS Modules + CSS Variables
- Axios для HTTP запросов

**Backend:**
- FastAPI (Python 3.11)
- SQLAlchemy (ORM)
- PostgreSQL 15
- Yandex GPT API
- IMAP/SMTP для почты

**Infrastructure:**
- Docker + Docker Compose
- Nginx (reverse proxy)
- Git для версионирования

## Быстрый старт

### Предварительные требования

- Docker Desktop установлен и запущен
- Git (опционально, для клонирования)
- 8GB RAM минимум
- Порты 3000, 8000, 5432 свободны

### 1. Клонирование репозитория

```bash
git clone https://github.com/BogdanRomanovvv/AI_banking_assistant.git
cd AI_banking_assistant
```

### 2. Настройка окружения

Создайте файл `.env` в корне проекта:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@db:5432/banking_ai

# Yandex GPT API
YANDEX_API_KEY=ваш_api_key
YANDEX_FOLDER_ID=ваш_folder_id
YANDEX_MODEL=yandexgpt

# Yandex Mail (IMAP/SMTP)
YANDEX_MAIL_LOGIN=ваш_email@yandex.ru
YANDEX_MAIL_PASSWORD=ваш_пароль_приложения
YANDEX_MAIL_IMAP_SERVER=imap.yandex.ru
YANDEX_MAIL_IMAP_PORT=993
YANDEX_MAIL_CHECK_INTERVAL=60

# SMTP
YANDEX_MAIL_SMTP_SERVER=smtp.yandex.ru
YANDEX_MAIL_SMTP_PORT=465
YANDEX_MAIL_SMTP_USE_SSL=true
```

### 3. Запуск проекта

#### Windows PowerShell:
```powershell
# Запуск всех сервисов
docker-compose up -d --build

# Или используйте готовый скрипт
.\docker-start.ps1
```

#### Linux/MacOS:
```bash
# Запуск всех сервисов
docker-compose up -d --build
```

### 4. Проверка запуска

```powershell
# Проверить статус контейнеров
docker ps

# Должны быть запущены:
# - banking_ai_frontend (port 3000)
# - banking_ai_backend (port 8000)
# - banking_ai_db (port 5432)
```

### 5. Доступ к приложению

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Database:** localhost:5432

### 6. Тестовые пользователи

Система автоматически создает тестовых пользователей при первом запуске:

| Роль | Username | Password | Описание |
|------|----------|----------|----------|
| Администратор | admin | admin123 | Полный доступ |
| Оператор | operator | oper123 | Обработка писем |
| Юрист | lawyer | law123 | Согласование юр. вопросов |
| Маркетолог | marketing | mark123 | Согласование маркетинга |

## Остановка проекта

### Windows PowerShell:
```powershell
# Остановка всех сервисов
docker-compose down

# Или используйте готовый скрипт
.\docker-stop.ps1

# Остановка с удалением volumes (БД будет очищена!)
docker-compose down -v
```

### Linux/MacOS:
```bash
# Остановка всех сервисов
docker-compose down

# Остановка с удалением volumes
docker-compose down -v
```

## Управление сервисами

### Перезапуск отдельного сервиса:
```powershell
# Перезапуск frontend
docker-compose restart frontend

# Перезапуск backend
docker-compose restart backend

# Перезапуск БД
docker-compose restart db
```

### Пересборка с изменениями:
```powershell
# Пересборка только frontend
docker-compose up -d --build frontend

# Пересборка всех сервисов
docker-compose up -d --build
```

### Просмотр логов:
```powershell
# Логи всех сервисов
docker-compose logs -f

# Логи конкретного сервиса
docker logs banking_ai_backend --tail 50 -f

# Логи backend с фильтром
docker logs banking_ai_backend 2>&1 | Select-String "ERROR"
```

## Структура проекта

```
bankingAI/
├── backend/                    # Backend приложение
│   ├── app/
│   │   ├── api/               # API endpoints
│   │   │   └── routes.py
│   │   ├── services/          # Бизнес-логика
│   │   │   ├── yandex_gpt.py  # AI анализ
│   │   │   ├── letter_service.py
│   │   │   ├── mail_service.py
│   │   │   ├── priority_service.py
│   │   │   └── analytics_service.py
│   │   ├── models.py          # SQLAlchemy модели
│   │   ├── schemas.py         # Pydantic схемы
│   │   ├── database.py        # DB конфигурация
│   │   ├── auth.py            # Аутентификация
│   │   ├── config.py          # Настройки
│   │   └── main.py            # Entry point
│   ├── knowledge_base.json    # База знаний банка
│   ├── requirements.txt       # Python зависимости
│   └── Dockerfile
│
├── frontend/                   # Frontend приложение
│   ├── src/
│   │   ├── components/        # React компоненты
│   │   │   ├── KanbanBoard.tsx
│   │   │   ├── ApproverKanbanBoard.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── LetterDetail.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   └── UserManagement.tsx
│   │   ├── services/          # API клиенты
│   │   │   └── api.ts
│   │   ├── types/             # TypeScript типы
│   │   │   └── index.ts
│   │   ├── App.tsx            # Главный компонент
│   │   ├── App.css            # Стили
│   │   └── main.tsx           # Entry point
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── nginx.conf             # Nginx конфигурация
│   └── Dockerfile
│
├── docker-compose.yml         # Docker Compose конфигурация
├── docker-start.ps1           # Скрипт запуска (Windows)
├── docker-stop.ps1            # Скрипт остановки (Windows)
├── .env                       # Переменные окружения (создать вручную)
├── .gitignore
└── README.md                  # Эта документация
```

## База данных

### Подключение к PostgreSQL:
```powershell
# Вход в контейнер БД
docker exec -it banking_ai_db psql -U postgres -d banking_ai

# Просмотр таблиц
\dt

# Выход
\q
```

### Основные таблицы:
- `users` - пользователи системы
- `letters` - письма и вся информация о них
- `notifications` - уведомления (в разработке)

### Выполнение SQL-миграций:
```powershell
# Применить SQL файл
Get-Content backend\add_sla_reasoning.sql | docker exec -i banking_ai_db psql -U postgres -d banking_ai
```

### Очистка БД:
```powershell
# Удалить все письма
docker exec -it banking_ai_db psql -U postgres -d banking_ai -c "DELETE FROM letters;"

# Пересоздать БД (все данные будут потеряны!)
docker-compose down -v
docker-compose up -d
```

## Безопасность

- JWT токены для аутентификации
- Хеширование паролей (bcrypt)
- CORS настроен только для localhost
- Переменные окружения в `.env` (не коммитится в git)
- Пароли приложений для Yandex Mail

## Мониторинг и отладка

### Проверка здоровья сервисов:
```powershell
# Health check backend
curl http://localhost:8000/health

# Health check БД
docker exec banking_ai_db pg_isready -U postgres
```

### Типичные проблемы:

**Проблема:** Письма не приходят
```powershell
# Решение: проверить логи и перезапустить backend
docker logs banking_ai_backend --tail 50
docker-compose restart backend
```

**Проблема:** Frontend не открывается
```powershell
# Решение: пересобрать frontend
docker-compose up -d --build frontend
```

**Проблема:** Ошибка подключения к БД
```powershell
# Решение: проверить статус и перезапустить
docker ps
docker-compose restart db
```

## Дизайн система

- **Цвета:**
  - Primary: #2563EB (blue-600)
  - Success: #16A34A (green-600)
  - Warning: #F59E0B (amber-500)
  - Danger: #DC2626 (red-600)

- **Градиенты:**
  - Основной: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`


---

