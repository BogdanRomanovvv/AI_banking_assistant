import { useState, useEffect } from 'react';
import './App.css';
import { Letter, LetterStatus } from './types';
import { letterService } from './services/api';
import { KanbanBoard } from './components/KanbanBoard';
import { LetterDetail } from './components/LetterDetail';

function App() {
    const [letters, setLetters] = useState<Letter[]>([]);
    const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
    const [showDetail, setShowDetail] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadLetters();
        const interval = setInterval(loadLetters, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadLetters = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await letterService.getLetters();
            setLetters(data);
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

    return (
        <div className="app">
            <header className="header">
                <div className="header-content">
                    <h1>Banking AI Assistant</h1>
                </div>
            </header>

            <div className="container">
                {error && <div className="error">{error}</div>}

                {loading && <div className="loading">Загрузка...</div>}

                <KanbanBoard
                    letters={letters}
                    onSelectLetter={handleSelectLetter}
                    onStatusChange={handleStatusChange}
                />
            </div>

            {showDetail && selectedLetter && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={handleCloseModal}>×</button>
                        <LetterDetail
                            letter={selectedLetter}
                            onAnalyze={handleAnalyzeLetter}
                            onUpdateResponse={handleUpdateResponse}
                            onStartApproval={handleStartApproval}
                            onApprovalAction={handleApprovalAction}
                        />
                    </div>
                </div>
            )}

            {/* UI создания новых писем отключен */}
        </div>
    );
}

export default App;
