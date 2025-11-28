import { useState, useEffect } from 'react';
import './styles/global.css';
import './App.css';
import { Letter, LetterStatus, User } from './types';
import { letterService, authService } from './services/api';
import { Board } from './components/board';
import { Header } from './components/layout';
import { Modal } from './components/ui';
import { LetterDetail } from './components/LetterDetail';
import UserManagement from './components/UserManagement';
import LoginForm from './components/LoginForm';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [currentView, setCurrentView] = useState<'kanban' | 'users'>('kanban');
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
            loadLetters();
            // Обновление каждые 30 секунд
            const interval = setInterval(loadLetters, 30000);
            return () => clearInterval(interval);
        }
    }, [currentView, isAuthenticated]);

    const loadLetters = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await letterService.getLetters();
            setLetters(data);

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
            setLoading(false);
        }
    };

    // Создание новых писем из UI отключено

    const handleAnalyzeLetter = async (id: number) => {
        try {
            setLoading(true);
            setError(null);
            const updated = await letterService.analyzeLetter(id);
            setLetters(letters.map(l => l.id === id ? updated : l));
            setSelectedLetter(updated);
        } catch (err) {
            setError('Ошибка анализа');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

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
            setSelectedLetter(updated);
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

    // Если не аутентифицирован - показываем форму входа
    if (!isAuthenticated) {
        return <LoginForm onLoginSuccess={handleLoginSuccess} />;
    }

    return (
        <div className="app">
            <Header
                currentView={currentView}
                onViewChange={setCurrentView}
                currentUser={currentUser}
                onLogout={handleLogout}
            />

            <main className="main-content">
                {error && (
                    <div className="error-banner">
                        <span>{error}</span>
                        <button onClick={() => setError(null)}>✕</button>
                    </div>
                )}

                {currentView === 'kanban' ? (
                    <>
                        {loading && <div className="loading-overlay">Загрузка...</div>}
                        <Board
                            letters={letters}
                            onCardClick={handleSelectLetter}
                            onStatusChange={handleStatusChange}
                        />
                    </>
                ) : (
                    <UserManagement />
                )}
            </main>

            <Modal
                isOpen={showDetail && selectedLetter !== null}
                onClose={handleCloseModal}
                title={`Письмо MBA-${selectedLetter?.id}`}
                size="lg"
            >
                {selectedLetter && (
                    <LetterDetail
                        letter={selectedLetter}
                        currentUser={currentUser!}
                        onAnalyze={handleAnalyzeLetter}
                        onUpdateResponse={handleUpdateResponse}
                        onStartApproval={handleStartApproval}
                        onApprovalAction={handleApprovalAction}
                    />
                )}
            </Modal>
        </div>
    );
}

export default App;
