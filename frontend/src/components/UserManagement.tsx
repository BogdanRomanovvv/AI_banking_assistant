import React, { useState, useEffect } from 'react';
import { userService, authService } from '../services/api';
import { User, UserCreate, UserRole } from '../types';
import '../App.css';

interface FormData {
    username: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    middle_name: string;
    role: UserRole;
}

const UserManagement: React.FC = () => {
    const [formData, setFormData] = useState<FormData>({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        middle_name: '',
        role: UserRole.OPERATOR
    });
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await userService.getUsers();
            setUsers(data);
        } catch (err) {
            console.error('Ошибка при загрузке пользователей:', err);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const userData: UserCreate = {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                first_name: formData.first_name,
                last_name: formData.last_name,
                middle_name: formData.middle_name || undefined,
                role: formData.role
            };

            await authService.register(userData);

            setSuccess('Пользователь успешно зарегистрирован!');

            // Очистка формы
            setFormData({
                username: '',
                email: '',
                password: '',
                first_name: '',
                last_name: '',
                middle_name: '',
                role: UserRole.OPERATOR
            });

            loadUsers();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Произошла ошибка при регистрации');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Вы уверены, что хотите удалить этого пользователя?')) {
            return;
        }

        try {
            await userService.deleteUser(id);
            setSuccess('Пользователь успешно удален');
            loadUsers();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Произошла ошибка при удалении');
        }
    };

    const getFullName = (user: User) => {
        return `${user.last_name} ${user.first_name}${user.middle_name ? ' ' + user.middle_name : ''}`;
    };

    const getRoleName = (role: UserRole) => {
        const roleNames: Record<UserRole, string> = {
            [UserRole.ADMIN]: 'Администратор',
            [UserRole.OPERATOR]: 'Оператор',
            [UserRole.LAWYER]: 'Юрист',
            [UserRole.MARKETING]: 'Маркетолог'
        };
        return roleNames[role] || role;
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1>Управление пользователями</h1>

            {/* Форма регистрации */}
            <div style={{
                backgroundColor: '#f5f5f5',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '30px'
            }}>
                <h2>Создать нового пользователя</h2>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Username <span style={{ color: 'red' }}>*</span>
                            </label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleInputChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    borderRadius: '4px',
                                    border: '1px solid #ccc'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Email <span style={{ color: 'red' }}>*</span>
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    borderRadius: '4px',
                                    border: '1px solid #ccc'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Пароль <span style={{ color: 'red' }}>*</span>
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                required
                                minLength={6}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    borderRadius: '4px',
                                    border: '1px solid #ccc'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Роль <span style={{ color: 'red' }}>*</span>
                            </label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleInputChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    borderRadius: '4px',
                                    border: '1px solid #ccc'
                                }}
                            >
                                <option value={UserRole.OPERATOR}>Оператор</option>
                                <option value={UserRole.LAWYER}>Юрист</option>
                                <option value={UserRole.MARKETING}>Маркетолог</option>
                                <option value={UserRole.ADMIN}>Администратор</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Фамилия <span style={{ color: 'red' }}>*</span>
                            </label>
                            <input
                                type="text"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleInputChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    borderRadius: '4px',
                                    border: '1px solid #ccc'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Имя <span style={{ color: 'red' }}>*</span>
                            </label>
                            <input
                                type="text"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleInputChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    borderRadius: '4px',
                                    border: '1px solid #ccc'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Отчество
                            </label>
                            <input
                                type="text"
                                name="middle_name"
                                value={formData.middle_name}
                                onChange={handleInputChange}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    borderRadius: '4px',
                                    border: '1px solid #ccc'
                                }}
                            />
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            padding: '10px',
                            backgroundColor: '#ffebee',
                            color: '#c62828',
                            borderRadius: '4px',
                            marginTop: '15px'
                        }}>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div style={{
                            padding: '10px',
                            backgroundColor: '#e8f5e9',
                            color: '#2e7d32',
                            borderRadius: '4px',
                            marginTop: '15px'
                        }}>
                            {success}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            marginTop: '15px',
                            padding: '10px 20px',
                            backgroundColor: loading ? '#ccc' : '#1976d2',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        {loading ? 'Создание...' : 'Создать пользователя'}
                    </button>
                </form>
            </div>

            {/* Список пользователей */}
            <div>
                <h2>Зарегистрированные пользователи ({users.length})</h2>
                {users.length === 0 ? (
                    <p style={{ color: '#666' }}>Пока нет зарегистрированных пользователей</p>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                        gap: '15px'
                    }}>
                        {users.map(user => (
                            <div
                                key={user.id}
                                style={{
                                    padding: '15px',
                                    backgroundColor: 'white',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                            >
                                <h3 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>
                                    {getFullName(user)}
                                </h3>
                                <p style={{ margin: '5px 0' }}>
                                    <strong>Username:</strong> {user.username}
                                </p>
                                <p style={{ margin: '5px 0' }}>
                                    <strong>Email:</strong> {user.email}
                                </p>
                                <p style={{ margin: '5px 0' }}>
                                    <strong>Роль:</strong> {getRoleName(user.role)}
                                </p>
                                <p style={{ margin: '5px 0' }}>
                                    <strong>Статус:</strong> {user.is_active ? '✅ Активен' : '❌ Неактивен'}
                                </p>
                                <p style={{ margin: '5px 0', fontSize: '12px', color: '#999' }}>
                                    Создан: {new Date(user.created_at).toLocaleDateString('ru-RU')}
                                </p>
                                <button
                                    onClick={() => handleDelete(user.id)}
                                    style={{
                                        marginTop: '10px',
                                        padding: '5px 10px',
                                        backgroundColor: '#d32f2f',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                >
                                    Удалить
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;
