import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Letter } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Chip } from '../ui/Chip';
import styles from './Card.module.css';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export interface CardProps {
  letter: Letter;
  index: number;
  onClick: () => void;
}

const getTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    info_request: 'Запрос информации',
    complaint: 'Жалоба',
    regulatory: 'Регуляторное',
    partnership: 'Партнёрство',
    approval_request: 'Запрос одобрения',
    notification: 'Уведомление',
    other: 'Другое',
  };
  return labels[type] || type;
};

const getTypeColor = (type: string): 'blue' | 'orange' | 'green' | 'yellow' | 'gray' | 'purple' => {
  const colors: Record<string, 'blue' | 'orange' | 'green' | 'yellow' | 'gray' | 'purple'> = {
    info_request: 'blue',
    complaint: 'orange',
    regulatory: 'purple',
    partnership: 'green',
    approval_request: 'yellow',
    notification: 'gray',
  };
  return colors[type] || 'gray';
};

const getPriorityLabel = (priority: number): string => {
  if (priority >= 8) return 'Высокий';
  if (priority >= 5) return 'Средний';
  return 'Низкий';
};

const getPriorityColor = (priority: number): 'orange' | 'yellow' | 'gray' => {
  if (priority >= 8) return 'orange';
  if (priority >= 5) return 'yellow';
  return 'gray';
};

export const Card: React.FC<CardProps> = ({ letter, index, onClick }) => {
  const assigneeName = letter.sender_name || letter.sender_email || 'Неизвестный отправитель';

  return (
    <Draggable draggableId={letter.id.toString()} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`${styles.card} ${snapshot.isDragging ? styles.dragging : ''}`}
          onClick={onClick}
        >
          <div className={styles.header}>
            <span className={styles.id}>MBA-{letter.id}</span>
            {letter.priority !== undefined && letter.priority !== null && (
              <Chip
                label={getPriorityLabel(letter.priority)}
                color={getPriorityColor(letter.priority)}
                size="sm"
              />
            )}
          </div>

          <h3 className={styles.title}>{letter.subject || 'Без темы'}</h3>

          {letter.classification_data?.type && (
            <div className={styles.tags}>
              <Chip
                label={getTypeLabel(letter.classification_data.type)}
                color={getTypeColor(letter.classification_data.type)}
                size="sm"
              />
            </div>
          )}

          {letter.extracted_entities?.request_summary && (
            <p className={styles.summary}>
              {letter.extracted_entities.request_summary}
            </p>
          )}

          <div className={styles.footer}>
            <Avatar name={assigneeName} size="sm" />
            <span className={styles.date}>
              {format(new Date(letter.created_at), 'd MMM', { locale: ru })}
            </span>
          </div>
        </div>
      )}
    </Draggable>
  );
};
