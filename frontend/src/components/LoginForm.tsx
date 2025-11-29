import React, { useState } from 'react';
import { authService } from '../services/api';
import { LoginCredentials, User } from '../types';
import '../App.css';

interface LoginFormProps {
    onLoginSuccess: (user: User) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
    const [credentials, setCredentials] = useState<LoginCredentials>({
        username: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCredentials(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await authService.login(credentials);
            const user = await authService.getCurrentUser();
            onLoginSuccess(user);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Ошибка входа в систему');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '24px'
        }}>
            <div style={{
                backgroundColor: 'var(--bg-card)',
                padding: '48px',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-xl)',
                width: '100%',
                maxWidth: '480px',
                animation: 'slideUp 0.4s ease-out'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: 'linear-gradient(135deg, var(--primary) 0%, #1D4ED8 100%)',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px',
                        boxShadow: 'var(--shadow-lg)',
                        fontSize: '40px'
                    }}>
                        BA
                    </div>
                    <h1 style={{
                        fontSize: '28px',
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                        marginBottom: '8px',
                        letterSpacing: '-0.02em'
                    }}>
                        Banking AI Assistant
                    </h1>
                    <p style={{
                        color: 'var(--text-secondary)',
                        fontSize: '15px'
                    }}>
                        Интеллектуальная система обработки корреспонденции
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="username">
                            Имя пользователя
                        </label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            className="form-input"
                            value={credentials.username}
                            onChange={handleInputChange}
                            required
                            autoFocus
                            placeholder="Введите имя пользователя"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="password">
                            Пароль
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            className="form-input"
                            value={credentials.password}
                            onChange={handleInputChange}
                            required
                            placeholder="Введите пароль"
                        />
                    </div>

                    {error && (
                        <div style={{
                            padding: '16px',
                            backgroundColor: 'var(--danger-light)',
                            color: 'var(--danger)',
                            borderRadius: 'var(--radius-lg)',
                            marginBottom: '24px',
                            border: '1px solid var(--danger)',
                            fontSize: '14px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <span>⚠️</span>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%' }}
                    >
                        {loading ? (
                            <>
                                <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></span>
                                Вход...
                            </>
                        ) : (
                            'Войти в систему'
                        )}
                    </button>
                </form>

                <div style={{
                    marginTop: '32px',
                    padding: '20px',
                    backgroundColor: 'var(--primary-light)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border)',
                    fontSize: '13px'
                }}>
                    <p style={{
                        margin: '0 0 16px 0',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        fontSize: '14px'
                    }}>
                        Тестовые аккаунты:
                    </p>
                    <div style={{ display: 'grid', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                            <span><strong>Администратор:</strong></span>
                            <code style={{ padding: '2px 8px', background: 'white', borderRadius: '4px' }}>admin / admin123</code>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                            <span><strong>Оператор:</strong></span>
                            <code style={{ padding: '2px 8px', background: 'white', borderRadius: '4px' }}>operator / operator123</code>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                            <span><strong>Юрист:</strong></span>
                            <code style={{ padding: '2px 8px', background: 'white', borderRadius: '4px' }}>lawyer / lawyer123</code>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                            <span><strong>Маркетолог:</strong></span>
                            <code style={{ padding: '2px 8px', background: 'white', borderRadius: '4px' }}>marketing / marketing123</code>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;
