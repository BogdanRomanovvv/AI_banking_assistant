import axios from 'axios';
import { Letter, LetterCreate, LetterUpdate, LetterStatus, ApprovalCommentRequest, User, UserCreate, UserUpdate, LoginCredentials, RegisterData, Token } from '../types';

const API_BASE_URL = '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Добавляем токен к каждому запросу
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth service
export const authService = {
    // Вход
    login: async (credentials: LoginCredentials): Promise<Token> => {
        const formData = new FormData();
        formData.append('username', credentials.username);
        formData.append('password', credentials.password);

        const response = await api.post<Token>('/auth/login', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        // Сохраняем токен
        localStorage.setItem('access_token', response.data.access_token);
        return response.data;
    },

    // Регистрация
    register: async (data: RegisterData): Promise<User> => {
        const response = await api.post<User>('/auth/register', data);
        return response.data;
    },

    // Получить текущего пользователя
    getCurrentUser: async (): Promise<User> => {
        const response = await api.get<User>('/auth/me');
        return response.data;
    },

    // Выход
    logout: () => {
        localStorage.removeItem('access_token');
    },

    // Проверка авторизации
    isAuthenticated: (): boolean => {
        return !!localStorage.getItem('access_token');
    }
};

// User service
export const userService = {
    // Получить всех работников
    getUsers: async (): Promise<User[]> => {
        const response = await api.get<User[]>('/users/');
        return response.data;
    },

    // Получить работника по ID
    getUser: async (id: number): Promise<User> => {
        const response = await api.get<User>(`/users/${id}`);
        return response.data;
    },

    // Зарегистрировать нового работника
    registerUser: async (user: UserCreate): Promise<User> => {
        const response = await api.post<User>('/users/', user);
        return response.data;
    },

    // Обновить данные работника
    updateUser: async (id: number, update: UserUpdate): Promise<User> => {
        const response = await api.patch<User>(`/users/${id}`, update);
        return response.data;
    },

    // Удалить работника
    deleteUser: async (id: number): Promise<void> => {
        await api.delete(`/users/${id}`);
    },
};

// Letter service
export const letterService = {
    // Получить все письма
    getLetters: async (status?: LetterStatus): Promise<Letter[]> => {
        const params = status ? { status } : {};
        const response = await api.get<Letter[]>('/letters/', { params });
        return response.data;
    },

    // Получить письмо по ID
    getLetter: async (id: number): Promise<Letter> => {
        const response = await api.get<Letter>(`/letters/${id}`);
        return response.data;
    },

    // Создать новое письмо
    createLetter: async (letter: LetterCreate): Promise<Letter> => {
        const response = await api.post<Letter>('/letters/', letter);
        return response.data;
    },

    // Анализировать письмо
    analyzeLetter: async (id: number): Promise<Letter> => {
        const response = await api.post<Letter>(`/letters/${id}/analyze`);
        return response.data;
    },

    // Обновить письмо
    updateLetter: async (id: number, update: LetterUpdate): Promise<Letter> => {
        const response = await api.patch<Letter>(`/letters/${id}`, update);
        return response.data;
    },

    // Начать согласование
    startApproval: async (id: number): Promise<Letter> => {
        const response = await api.post<Letter>(`/letters/${id}/approval/start`);
        return response.data;
    },

    // Добавить комментарий согласующего
    addApprovalComment: async (id: number, comment: ApprovalCommentRequest): Promise<Letter> => {
        const response = await api.post<Letter>(`/letters/${id}/approval/comment`, comment);
        return response.data;
    },
};
