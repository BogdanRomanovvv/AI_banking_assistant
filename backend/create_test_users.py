#!/usr/bin/env python3
"""Скрипт для создания тестовых пользователей"""

from passlib.context import CryptContext
from sqlalchemy import create_engine, text
import os

# Настройка passlib
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Подключение к БД
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/banking_ai")
engine = create_engine(DATABASE_URL)

# Тестовые пользователи
test_users = [
    {
        "username": "admin",
        "email": "admin@bank.com",
        "password": "admin123",
        "first_name": "Администратор",
        "last_name": "Системы",
        "role": "ADMIN"
    },
    {
        "username": "operator",
        "email": "operator@bank.com",
        "password": "operator123",
        "first_name": "Иван",
        "last_name": "Операторов",
        "role": "OPERATOR"
    },
    {
        "username": "lawyer",
        "email": "lawyer@bank.com",
        "password": "lawyer123",
        "first_name": "Мария",
        "last_name": "Юристова",
        "role": "LAWYER"
    },
    {
        "username": "compliance",
        "email": "compliance@bank.com",
        "password": "compliance123",
        "first_name": "Отдел",
        "last_name": "Комплаенса",
        "role": "COMPLIANCE"
    }
]

def create_users():
    with engine.connect() as conn:
        # Удаляем существующих пользователей
        conn.execute(text("DELETE FROM users WHERE username IN ('admin', 'operator', 'lawyer', 'compliance')"))
        conn.commit()
        
        # Создаем новых пользователей
        for user in test_users:
            hashed_password = pwd_context.hash(user["password"])
            
            sql = text("""
                INSERT INTO users (username, email, hashed_password, first_name, last_name, role, is_active, created_at)
                VALUES (:username, :email, :hashed_password, :first_name, :last_name, :role, true, NOW())
            """)
            
            conn.execute(sql, {
                "username": user["username"],
                "email": user["email"],
                "hashed_password": hashed_password,
                "first_name": user["first_name"],
                "last_name": user["last_name"],
                "role": user["role"]
            })
            
            print(f"✅ Создан пользователь: {user['username']} / {user['password']}")
        
        conn.commit()
        print("\n✅ Все тестовые пользователи созданы!")

if __name__ == "__main__":
    create_users()
