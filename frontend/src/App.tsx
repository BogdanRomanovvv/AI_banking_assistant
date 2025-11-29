import { useState, useEffect } from 'react';
import './App.css';
import { Letter, LetterStatus, User, UserRole } from './types';
import { letterService, authService } from './services/api';
import { KanbanBoard } from './components/KanbanBoard';
import { ApproverKanbanBoard } from './components/ApproverKanbanBoard';
import { LetterDetail } from './components/LetterDetail';
import { Dashboard } from './components/Dashboard';
import UserManagement from './components/UserManagement';
import LoginForm from './components/LoginForm';
import { NotificationBell } from './components/NotificationBell';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [currentView, setCurrentView] = useState<'kanban' | 'analytics' | 'users'>('kanban');
    const [letters, setLetters] = useState<Letter[]>([]);
    const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
    const [showDetail, setShowDetail] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Проверка аутентификации при загрузке
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        if (authService.isAuthenticated()) {
            try {
                const user = await authService.getCurrentUser();
                setCurrentUser(user);
                setIsAuthenticated(true);
            } catch (err) {
                authService.logout();
                setIsAuthenticated(false);
            }
        }
    };

    const handleLoginSuccess = (user: User) => {
        setCurrentUser(user);
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        authService.logout();
        setCurrentUser(null);
        setIsAuthenticated(false);
    };

    useEffect(() => {
        if (isAuthenticated && currentView === 'kanban') {
            loadLetters(true); // Первая загрузка с loading indicator
            // Обновление каждые 10 секунд (без loading indicator)
            const interval = setInterval(() => loadLetters(false), 10000);
            return () => clearInterval(interval);
        }
    }, [currentView, isAuthenticated]);

    const loadLetters = async (showLoading = true) => {
        try {
            if (showLoading) {
                setLoading(true);
            }
            setError(null);
            const data = await letterService.getLetters();

            // Умное обновление: обновляем только если есть реальные изменения
            setLetters(prevLetters => {
                // Если количество писем изменилось - обновляем
                if (prevLetters.length !== data.length) {
                    return data;
                }

                // Проверяем, изменились ли письма
                const hasChanges = data.some(newLetter => {
                    const oldLetter = prevLetters.find(l => l.id === newLetter.id);
                    if (!oldLetter) return true;

                    // Сравниваем критичные поля
                    return oldLetter.status !== newLetter.status ||
                        oldLetter.updated_at !== newLetter.updated_at ||
                        (oldLetter.selected_response || '') !== (newLetter.selected_response || '') ||
                        (oldLetter.current_approver || '') !== (newLetter.current_approver || '');
                });

                // Обновляем только если есть изменения
                return hasChanges ? data : prevLetters;
            });

            // Если открыто модальное окно, обновляем и выбранное письмо
            if (selectedLetter) {
                const updatedSelectedLetter = data.find(l => l.id === selectedLetter.id);
                if (updatedSelectedLetter) {
                    setSelectedLetter(updatedSelectedLetter);
                }
            }
        } catch (err) {
            setError('Ошибка загрузки писем');
            console.error(err);
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    };

    // Создание новых писем из UI отключено

    const handleUpdateResponse = async (id: number, response: string) => {
        try {
            setLoading(true);
            setError(null);
            const updated = await letterService.updateLetter(id, { selected_response: response });
            setLetters(letters.map(l => l.id === id ? updated : l));
            setSelectedLetter(updated);
        } catch (err) {
            setError('Ошибка обновления ответа');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleStartApproval = async (id: number) => {
        try {
            setLoading(true);
            setError(null);
            const updated = await letterService.startApproval(id);
            setLetters(letters.map(l => l.id === id ? updated : l));
            setSelectedLetter(updated);
        } catch (err) {
            setError('Ошибка запуска согласования');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprovalAction = async (id: number, department: string, comment: string, approved: boolean) => {
        try {
            setLoading(true);
            setError(null);
            const updated = await letterService.addApprovalComment(id, { department, comment, approved });
            setLetters(letters.map(l => l.id === id ? updated : l));

            // Закрываем модальное окно после успешного согласования/отклонения
            // чтобы доска обновилась
            setShowDetail(false);
            setSelectedLetter(null);

            // Принудительно загружаем письма через небольшую задержку
            setTimeout(() => {
                loadLetters(false);
            }, 500);
        } catch (err) {
            setError('Ошибка согласования');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectLetter = (letter: Letter) => {
        setSelectedLetter(letter);
        setShowDetail(true);
    };

    const handleStatusChange = async (letterId: number, newStatus: LetterStatus) => {
        try {
            const updated = await letterService.updateLetter(letterId, { status: newStatus });
            setLetters(letters.map(l => l.id === letterId ? updated : l));
            if (selectedLetter?.id === letterId) {
                setSelectedLetter(updated);
            }
        } catch (err) {
            setError('Ошибка изменения статуса');
            console.error(err);
        }
    };

    const handleCloseModal = () => {
        setShowDetail(false);
        setSelectedLetter(null);
    };

    const getRoleName = (role: string) => {
        const roleNames: Record<string, string> = {
            'admin': 'Администратор',
            'operator': 'Оператор',
            'lawyer': 'Юрист',
            'accountant': 'Бухгалтер',
            'manager': 'Менеджер'
        };
        return roleNames[role] || role;
    };

    // Если не аутентифицирован - показываем форму входа
    if (!isAuthenticated) {
        return <LoginForm onLoginSuccess={handleLoginSuccess} />;
    }

    return (
        <div className="app">
            <header className="app-header">
                <div className="header-left">
                    <div className="app-logo">
                        Banking AI Assistant
                    </div>
                    <nav style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => setCurrentView('kanban')}
                            className={currentView === 'kanban' ? 'btn btn-primary' : 'btn btn-ghost'}
                        >
                            Письма
                        </button>
                        {(currentUser?.role === 'admin' || currentUser?.role === 'operator') && (
                            <button
                                onClick={() => setCurrentView('analytics')}
                                className={currentView === 'analytics' ? 'btn btn-primary' : 'btn btn-ghost'}
                            >
                                Аналитика
                            </button>
                        )}
                        {currentUser?.role === 'admin' && (
                            <button
                                onClick={() => setCurrentView('users')}
                                className={currentView === 'users' ? 'btn btn-primary' : 'btn btn-ghost'}
                            >
                                Пользователи
                            </button>
                        )}
                    </nav>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <NotificationBell
                        onNotificationClick={(letterId) => {
                            if (letterId) {
                                const letter = letters.find(l => l.id === letterId);
                                if (letter) {
                                    handleSelectLetter(letter);
                                }
                            }
                        }}
                    />
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                            {currentUser?.first_name} {currentUser?.last_name}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            {getRoleName(currentUser?.role || '')}
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="btn btn-outline btn-sm"
                        style={{ color: 'var(--danger)' }}
                        title="Выйти из системы"
                    >
                        Выйти
                    </button>
                </div>
            </header>

            <div className="container" style={{ padding: 0 }}>
                {error && (
                    <div style={{
                        margin: '24px',
                        padding: '16px 20px',
                        backgroundColor: 'var(--danger-light)',
                        color: 'var(--danger)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--danger)',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <span style={{ fontSize: '20px' }}>⚠️</span>
                        {error}
                    </div>
                )}

                {loading && currentView === 'kanban' && (
                    <div className="loading">
                        <div className="spinner"></div>
                        <span style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>Загрузка писем...</span>
                    </div>
                )}

                {currentView === 'kanban' ? (
                    // Для юристов и маркетологов показываем специальную доску с 2 колонками
                    currentUser && (currentUser.role === UserRole.LAWYER || currentUser.role === UserRole.MARKETING) ? (
                        <ApproverKanbanBoard
                            user={currentUser}
                            onSelectLetter={handleSelectLetter}
                            selectedLetterId={selectedLetter?.id}
                        />
                    ) : (
                        // Для админов и операторов обычная Kanban доска
                        <KanbanBoard
                            letters={letters}
                            onSelectLetter={handleSelectLetter}
                            onStatusChange={handleStatusChange}
                        />
                    )
                ) : currentView === 'analytics' ? (
                    <Dashboard currentUser={currentUser!} />
                ) : (
                    <UserManagement />
                )}
            </div>

            {showDetail && selectedLetter && currentView === 'kanban' && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                Письмо #{selectedLetter.id}
                            </h2>
                            <button className="modal-close" onClick={handleCloseModal} title="Закрыть">
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <LetterDetail
                                letter={selectedLetter}
                                currentUser={currentUser!}
                                onUpdateResponse={handleUpdateResponse}
                                onStartApproval={handleStartApproval}
                                onApprovalAction={handleApprovalAction}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
