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
            backgroundColor: '#f5f5f5'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '40px',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                width: '100%',
                maxWidth: '400px'
            }}>
                <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#1976d2' }}>
                    Banking AI Assistant
                </h1>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                            Имя пользователя
                        </label>
                        <input
                            type="text"
                            name="username"
                            value={credentials.username}
                            onChange={handleInputChange}
                            required
                            autoFocus
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '4px',
                                border: '1px solid #ccc',
                                fontSize: '16px'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                            Пароль
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={credentials.password}
                            onChange={handleInputChange}
                            required
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '4px',
                                border: '1px solid #ccc',
                                fontSize: '16px'
                            }}
                        />
                    </div>

                    {error && (
                        <div style={{
                            padding: '12px',
                            backgroundColor: '#ffebee',
                            color: '#c62828',
                            borderRadius: '4px',
                            marginBottom: '20px',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: loading ? '#ccc' : '#1976d2',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold',
                            fontSize: '16px'
                        }}
                    >
                        {loading ? 'Вход...' : 'Войти'}
                    </button>
                </form>

                <div style={{
                    marginTop: '30px',
                    padding: '15px',
                    backgroundColor: '#e3f2fd',
                    borderRadius: '4px',
                    fontSize: '14px'
                }}>
                    <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Тестовые аккаунты:</p>
                    <p style={{ margin: '5px 0' }}>
                        <strong>Администратор:</strong> admin / admin123
                    </p>
                    <p style={{ margin: '5px 0' }}>
                        <strong>Оператор:</strong> operator / operator123
                    </p>
                    <p style={{ margin: '5px 0' }}>
                        <strong>Юрист:</strong> lawyer / lawyer123
                    </p>
                    <p style={{ margin: '5px 0' }}>
                        <strong>Комплаенс:</strong> compliance / compliance123
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;
