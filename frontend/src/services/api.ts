import axios from 'axios';
import { Letter, LetterCreate, LetterUpdate, LetterStatus, ApprovalCommentRequest } from '../types';

const API_BASE_URL = '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

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
