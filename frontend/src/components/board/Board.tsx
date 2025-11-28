import React from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Letter, LetterStatus } from '../../types';
import { Column } from './Column';
import styles from './Board.module.css';

export interface BoardProps {
  letters: Letter[];
  onCardClick: (letter: Letter) => void;
  onStatusChange: (letterId: number, newStatus: LetterStatus) => void;
  onAddCard?: () => void;
}

export const Board: React.FC<BoardProps> = ({
  letters,
  onCardClick,
  onStatusChange,
  onAddCard,
}) => {
  const columns = [
    LetterStatus.NEW,
    LetterStatus.ANALYZING,
    LetterStatus.DRAFT_READY,
    LetterStatus.APPROVED,
  ];

  const getLettersByStatus = (status: LetterStatus): Letter[] => {
    return letters.filter((letter) => letter.status === status);
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, draggableId } = result;

    if (!destination) {
      return;
    }

    const letterId = parseInt(draggableId, 10);
    const newStatus = destination.droppableId as LetterStatus;

    onStatusChange(letterId, newStatus);
  };

  return (
    <div className={styles.board}>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className={styles.columns}>
          {columns.map((status) => (
            <Column
              key={status}
              status={status}
              letters={getLettersByStatus(status)}
              onCardClick={onCardClick}
              onAddCard={status === LetterStatus.NEW ? onAddCard : undefined}
            />
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};
