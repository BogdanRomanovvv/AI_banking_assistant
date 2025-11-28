import React from 'react';
import { Letter, LetterStatus } from '../types';

interface KanbanBoardProps {
    letters: Letter[];
    onSelectLetter: (letter: Letter) => void;
    onStatusChange: (letterId: number, newStatus: LetterStatus) => void;
}

const statusColumns = [
    { status: LetterStatus.NEW, title: 'Входящие' },
    { status: LetterStatus.ANALYZING, title: 'В обработке' },
    { status: LetterStatus.DRAFT_READY, title: 'Черновик готов' },
    { status: LetterStatus.IN_APPROVAL, title: 'На согласовании' },
    { status: LetterStatus.APPROVED, title: 'Согласовано' },
];

const typeLabels: Record<string, string> = {
    info_request: 'Запрос информации',
    complaint: 'Жалоба',
    regulatory: 'Регуляторный',
    partnership: 'Партнерство',
    approval_request: 'Согласование',
    notification: 'Уведомление',
    other: 'Другое'
};

const priorityLabels: Record<number, string> = {
    1: 'Высокий',
    2: 'Средний',
    3: 'Низкий'
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
    letters,
    onSelectLetter,
    onStatusChange
}) => {
    const canMove = (from: LetterStatus, to: LetterStatus) => {
        // Разрешаем только перенос из Входящих в В обработке
        return from === LetterStatus.NEW && to === LetterStatus.ANALYZING;
    };

    const getLettersByStatus = (status: LetterStatus) => {
        return letters.filter(letter => letter.status === status);
    };

    const handleDragStart = (e: React.DragEvent, letter: Letter) => {
        e.dataTransfer.setData('letterId', letter.id.toString());
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, newStatus: LetterStatus) => {
        e.preventDefault();
        const letterId = parseInt(e.dataTransfer.getData('letterId'));
        if (letterId) {
            const letter = letters.find(l => l.id === letterId);
            if (letter && canMove(letter.status, newStatus)) {
                onStatusChange(letterId, newStatus);
            }
        }
    };

    return (
        <div className="kanban-container">
            <div className="kanban-board">
                {statusColumns.map(column => {
                    const columnLetters = getLettersByStatus(column.status);

                    return (
                        <div
                            key={column.status}
                            className="kanban-column"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, column.status)}
                        >
                            <div className="column-header">
                                <div className="column-title">
                                    <span>{column.title}</span>
                                </div>
                                <span className="column-count">{columnLetters.length}</span>
                            </div>

                            <div className="column-content">
                                {columnLetters.length === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-state-text">Нет писем</div>
                                    </div>
                                ) : (
                                    columnLetters.map(letter => (
                                        <div
                                            key={letter.id}
                                            className="letter-card"
                                            draggable={letter.status === LetterStatus.NEW}
                                            onDragStart={(e) => handleDragStart(e, letter)}
                                            onClick={() => onSelectLetter(letter)}
                                        >
                                            <div className="letter-card-header">
                                                <span className="letter-card-id">#{letter.id}</span>
                                                <span className={`badge badge-priority-${letter.priority}`}>
                                                    {priorityLabels[letter.priority]}
                                                </span>
                                            </div>

                                            <div className="letter-card-title">{letter.subject}</div>

                                            <div className="letter-card-meta">
                                                {letter.letter_type && (
                                                    <span className="badge badge-type">
                                                        {typeLabels[letter.letter_type] || letter.letter_type}
                                                    </span>
                                                )}
                                                {letter.sla_hours && (
                                                    <span className="badge badge-sla">
                                                        SLA {letter.sla_hours}ч
                                                    </span>
                                                )}
                                            </div>

                                            {letter.sender_name && (
                                                <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '8px' }}>
                                                    {letter.sender_name}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
