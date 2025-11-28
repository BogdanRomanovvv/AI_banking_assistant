import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Letter, LetterStatus } from '../../types';
import { Card } from './Card';
import styles from './Column.module.css';
import { statusColumns } from '../../styles/tokens';

export interface ColumnProps {
  status: LetterStatus;
  letters: Letter[];
  onCardClick: (letter: Letter) => void;
  onAddCard?: () => void;
}

export const Column: React.FC<ColumnProps> = ({
  status,
  letters,
  onCardClick,
  onAddCard,
}) => {
  const columnConfig = statusColumns[status.toUpperCase() as keyof typeof statusColumns];
  const title = columnConfig?.title || status;
  const count = letters.length;

  return (
    <div className={styles.column}>
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <h2 className={styles.title}>{title}</h2>
          <span className={styles.count}>{count}</span>
        </div>
        {onAddCard && status === LetterStatus.NEW && (
          <button
            onClick={onAddCard}
            className={styles.addButton}
            aria-label="Добавить карточку"
            title="Добавить карточку"
          >
            +
          </button>
        )}
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`${styles.content} ${
              snapshot.isDraggingOver ? styles.draggingOver : ''
            }`}
          >
            {letters.length === 0 ? (
              <div className={styles.empty}>
                <p className={styles.emptyText}>Нет карточек</p>
              </div>
            ) : (
              letters.map((letter, index) => (
                <Card
                  key={letter.id}
                  letter={letter}
                  index={index}
                  onClick={() => onCardClick(letter)}
                />
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};
