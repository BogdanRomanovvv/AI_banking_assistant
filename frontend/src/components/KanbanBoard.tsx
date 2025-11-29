import React from 'react';
import { Letter, LetterStatus } from '../types';

interface KanbanBoardProps {
    letters: Letter[];
    onSelectLetter: (letter: Letter) => void;
    onStatusChange: (letterId: number, newStatus: LetterStatus) => void;
}

const statusColumns = [
    { status: LetterStatus.NEW, title: 'Входящие' },
    { status: LetterStatus.IN_PROGRESS, title: 'В обработке' },
    { status: LetterStatus.DRAFT_READY, title: 'Черновик готов' },
    { status: LetterStatus.IN_APPROVAL, title: 'На согласовании' },
    { status: LetterStatus.APPROVED, title: 'Отправленные' },
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
    const canMove = (letter: Letter, from: LetterStatus, to: LetterStatus) => {
        // Отладка
        console.log('canMove check:', {
            letterId: letter.id,
            letterType: letter.letter_type,
            from: from,
            to: to,
            isNotification: letter.letter_type?.toLowerCase() === 'notification'
        });

        // Для уведомлений разрешаем перемещение между NEW, IN_PROGRESS и APPROVED (для закрытия)
        if (letter.letter_type?.toLowerCase() === 'notification') {
            const canMoveNotification =
                (from === 'new' && to === 'in_progress') ||
                (from === 'in_progress' && to === 'new') ||
                (from === 'in_progress' && to === 'approved') ||
                (from === 'new' && to === 'approved');
            console.log('Notification can move:', canMoveNotification);
            return canMoveNotification;
        }

        // Для остальных писем - только перенос из Входящих в В обработке
        const canMoveRegular = from === 'new' && to === 'in_progress';
        console.log('Regular letter can move:', canMoveRegular);
        return canMoveRegular;
        return canMoveRegular;
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
        // Добавляем класс для визуального feedback
        const column = e.currentTarget as HTMLElement;
        column.classList.add('drag-over');
    };

    const handleDragLeave = (e: React.DragEvent) => {
        const column = e.currentTarget as HTMLElement;
        column.classList.remove('drag-over');
    };

    const handleDrop = (e: React.DragEvent, newStatus: LetterStatus) => {
        e.preventDefault();
        const column = e.currentTarget as HTMLElement;
        column.classList.remove('drag-over');

        const letterId = parseInt(e.dataTransfer.getData('letterId'));
        if (letterId) {
            const letter = letters.find(l => l.id === letterId);
            if (letter && canMove(letter, letter.status, newStatus)) {
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
                            onDragLeave={handleDragLeave}
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
                                        <div className="empty-state-icon">📭</div>
                                        <div className="empty-state-text">Нет писем</div>
                                    </div>
                                ) : (
                                    columnLetters.map(letter => (
                                        <div
                                            key={letter.id}
                                            className="letter-card"
                                            data-priority={letter.priority}
                                            draggable={
                                                letter.letter_type?.toLowerCase() === 'notification'
                                                    ? (letter.status === 'new' || letter.status === 'in_progress')
                                                    : letter.status === 'new'
                                            }
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
