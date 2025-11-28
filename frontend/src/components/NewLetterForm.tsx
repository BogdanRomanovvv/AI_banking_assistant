import React, { useState } from 'react';
import { LetterCreate } from '../types';

interface NewLetterFormProps {
    onSubmit: (letter: LetterCreate) => void;
    onCancel: () => void;
}

export const NewLetterForm: React.FC<NewLetterFormProps> = ({ onSubmit, onCancel }) => {
    const [formData, setFormData] = useState<LetterCreate>({
        subject: '',
        body: '',
        sender_email: '',
        sender_name: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="form-group">
                <label htmlFor="subject" className="form-label">Тема письма *</label>
                <input
                    type="text"
                    id="subject"
                    className="form-input"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Введите тему письма"
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="sender_name" className="form-label">Имя отправителя</label>
                <input
                    type="text"
                    id="sender_name"
                    className="form-input"
                    value={formData.sender_name}
                    onChange={(e) => setFormData({ ...formData, sender_name: e.target.value })}
                    placeholder="Иванов Иван Петрович"
                />
            </div>

            <div className="form-group">
                <label htmlFor="sender_email" className="form-label">Email отправителя</label>
                <input
                    type="email"
                    id="sender_email"
                    className="form-input"
                    value={formData.sender_email}
                    onChange={(e) => setFormData({ ...formData, sender_email: e.target.value })}
                    placeholder="example@company.ru"
                />
            </div>

            <div className="form-group">
                <label htmlFor="body" className="form-label">Текст письма *</label>
                <textarea
                    id="body"
                    className="form-textarea"
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    rows={12}
                    placeholder="Введите полный текст письма..."
                    required
                />
            </div>

            <div className="flex gap-8">
                <button type="submit" className="btn btn-primary">Создать письмо</button>
                <button type="button" className="btn btn-outline" onClick={onCancel}>Отмена</button>
            </div>
        </form>
    );
};
