import React from 'react';
import styles from './Chip.module.css';

export interface ChipProps {
  label: string;
  color?: 'blue' | 'orange' | 'green' | 'yellow' | 'gray' | 'purple';
  size?: 'sm' | 'md';
  onRemove?: () => void;
  className?: string;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  color = 'gray',
  size = 'sm',
  onRemove,
  className = '',
}) => {
  return (
    <span className={`${styles.chip} ${styles[color]} ${styles[size]} ${className}`}>
      <span className={styles.label}>{label}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className={styles.removeButton}
          aria-label={`Удалить ${label}`}
        >
          ✕
        </button>
      )}
    </span>
  );
};
