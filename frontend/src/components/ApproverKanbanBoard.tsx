import React, { useState, useEffect } from 'react';
import { Letter, LetterStatus, UserRole } from '../types';
import { letterService } from '../services/api';

interface ApproverKanbanBoardProps {
    user: { id: number; role: UserRole };
    onSelectLetter: (letter: Letter) => void;
    selectedLetterId?: number;
}

export const ApproverKanbanBoard: React.FC<ApproverKanbanBoardProps> = ({
    // user нужен для будущих расширений, пока используется только через context
    onSelectLetter,
    selectedLetterId
}) => {
    const [incomingLetters, setIncomingLetters] = useState<Letter[]>([]);
    const [myLetters, setMyLetters] = useState<Letter[]>([]);
    const [loading, setLoading] = useState(false);
    const [draggedLetter, setDraggedLetter] = useState<Letter | null>(null);

    useEffect(() => {
        loadLetters();
        const interval = setInterval(loadLetters, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadLetters = async () => {
        try {
            // Загружаем входящие (незарезервированные)
            const incoming = await letterService.getLetters(LetterStatus.IN_APPROVAL, false);
            setIncomingLetters(incoming);

            // Загружаем свои (зарезервированные за мной)
            const my = await letterService.getLetters(LetterStatus.IN_APPROVAL, true);
            setMyLetters(my);
        } catch (error) {
            console.error('Ошибка загрузки писем:', error);
        }
    };

    const handleDragStart = (e: React.DragEvent, letter: Letter) => {
        setDraggedLetter(letter);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, targetColumn: 'incoming' | 'my') => {
        e.preventDefault();

        if (!draggedLetter) return;

        // Можно перетаскивать только из "Входящие" в "В процессе"
        if (targetColumn === 'my' && !draggedLetter.reserved_by_user_id) {
            try {
                setLoading(true);
                await letterService.reserveLetter(draggedLetter.id);
                await loadLetters(); // Перезагружаем списки
            } catch (error: any) {
                alert(error.response?.data?.detail || 'Ошибка резервирования письма');
            } finally {
                setLoading(false);
            }
        }

        setDraggedLetter(null);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleString('ru-RU');
    };

    const getPriorityColor = (priority: number) => {
        switch (priority) {
            case 1: return '#ff4d4f';
            case 2: return '#faad14';
            case 3: return '#52c41a';
            default: return '#d9d9d9';
        }
    };

    const renderLetterCard = (letter: Letter, isDraggable: boolean) => (
        <div
            key={letter.id}
            className={`letter-card ${selectedLetterId === letter.id ? 'selected' : ''}`}
            draggable={isDraggable}
            onDragStart={(e) => handleDragStart(e, letter)}
            onClick={() => onSelectLetter(letter)}
            style={{
                padding: '12px',
                marginBottom: '8px',
                backgroundColor: '#fff',
                border: selectedLetterId === letter.id ? '2px solid #1890ff' : '1px solid #d9d9d9',
                borderRadius: '4px',
                cursor: isDraggable ? 'grab' : 'pointer',
                borderLeft: `4px solid ${getPriorityColor(letter.priority)}`
            }}
        >
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                {letter.subject}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
                От: {letter.sender_name || letter.sender_email || 'Неизвестно'}
            </div>
            <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                {formatDate(letter.created_at)}
            </div>
            {letter.reserved_at && (
                <div style={{ fontSize: '11px', color: '#1890ff', marginTop: '4px' }}>
                    ⏱️ Взято в работу: {formatDate(letter.reserved_at)}
                </div>
            )}
        </div>
    );

    return (
        <div style={{ display: 'flex', gap: '16px', height: 'calc(100vh - 200px)', padding: '16px' }}>
            {/* Колонка: Входящие на согласование */}
            <div
                style={{
                    flex: 1,
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px',
                    padding: '16px',
                    overflow: 'auto'
                }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'incoming')}
            >
                <h3 style={{ marginTop: 0, marginBottom: '16px' }}>
                    📥 Входящие на согласование ({incomingLetters.length})
                </h3>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
                    Перетащите письмо в "В процессе", чтобы взять его в работу
                </div>
                {incomingLetters.map(letter => renderLetterCard(letter, true))}
                {incomingLetters.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#999', padding: '32px' }}>
                        Нет новых писем на согласовании
                    </div>
                )}
            </div>

            {/* Колонка: В процессе (мои) */}
            <div
                style={{
                    flex: 1,
                    backgroundColor: '#e6f7ff',
                    borderRadius: '8px',
                    padding: '16px',
                    overflow: 'auto'
                }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'my')}
            >
                <h3 style={{ marginTop: 0, marginBottom: '16px' }}>
                    ✅ В процессе согласования ({myLetters.length})
                </h3>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
                    Ваши зарезервированные письма
                </div>
                {myLetters.map(letter => renderLetterCard(letter, false))}
                {myLetters.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#999', padding: '32px' }}>
                        У вас нет писем в работе
                    </div>
                )}
            </div>

            {loading && (
                <div style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    color: '#fff',
                    padding: '16px 32px',
                    borderRadius: '4px',
                    zIndex: 9999
                }}>
                    Резервирование...
                </div>
            )}
        </div>
    );
};
