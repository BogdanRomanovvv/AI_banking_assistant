import React from 'react';
import { Letter } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface LetterListProps {
    letters: Letter[];
    onSelectLetter: (letter: Letter) => void;
    selectedLetterId?: number;
}

const statusLabels: Record<string, string> = {
    new: 'Новое',
    analyzing: 'Анализ',
    draft_ready: 'Черновик готов',
    in_approval: 'На согласовании',
    approved: 'Согласовано',
    sent: 'Отправлено'
};

const priorityLabels: Record<number, string> = {
    1: 'Высокий',
    2: 'Средний',
    3: 'Низкий'
};

export const LetterList: React.FC<LetterListProps> = ({ letters, onSelectLetter, selectedLetterId }) => {
    return (
        <div className="letter-list">
            {letters.length === 0 ? (
                <div className="empty-state">
                    <p>Нет писем</p>
                </div>
            ) : (
                letters.map((letter) => (
                    <div
                        key={letter.id}
                        className={`letter-item ${selectedLetterId === letter.id ? 'selected' : ''}`}
                        onClick={() => onSelectLetter(letter)}
                    >
                        <div className="letter-item-header">
                            <div className="letter-item-badges">
                                <span className={`status-badge status-${letter.status}`}>
                                    {statusLabels[letter.status] || letter.status}
                                </span>
                                <span className={`priority-badge priority-${letter.priority}`}>
                                    {priorityLabels[letter.priority] || letter.priority}
                                </span>
                            </div>
                            <span className="letter-item-time">
                                {formatDistanceToNow(new Date(letter.created_at), { addSuffix: true, locale: ru })}
                            </span>
                        </div>
                        <h3 className="letter-item-subject">{letter.subject}</h3>
                        {letter.sender_name && (
                            <p className="letter-item-sender">От: {letter.sender_name}</p>
                        )}
                        {letter.sla_hours && (
                            <p className="letter-item-sla">SLA: {letter.sla_hours}ч</p>
                        )}
                    </div>
                ))
            )}
        </div>
    );
};
