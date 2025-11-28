import React from 'react';
import { Button } from '../ui/Button';
import styles from './Header.module.css';

export interface HeaderProps {
  currentView: 'kanban' | 'users';
  onViewChange: (view: 'kanban' | 'users') => void;
  currentUser: { first_name: string; last_name: string; role: string } | null;
  onLogout: () => void;
}

const getRoleNameRu = (role: string): string => {
  const roleNames: Record<string, string> = {
    'admin': 'Администратор',
    'ADMIN': 'Администратор',
    'operator': 'Оператор',
    'OPERATOR': 'Оператор',
    'lawyer': 'Юрист',
    'LAWYER': 'Юрист',
    'compliance': 'Комплаенс',
    'COMPLIANCE': 'Комплаенс',
    'accountant': 'Бухгалтер',
    'ACCOUNTANT': 'Бухгалтер',
    'manager': 'Менеджер',
    'MANAGER': 'Менеджер',
  };
  return roleNames[role] || role;
};

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  currentUser,
  onLogout,
}) => {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div className={styles.logo}>
          <h1 className={styles.logoText}>Банковский Помощник AI</h1>
        </div>

        <nav className={styles.nav}>
          <button
            className={`${styles.navButton} ${
              currentView === 'kanban' ? styles.active : ''
            }`}
            onClick={() => onViewChange('kanban')}
          >
            Доска
          </button>
          <button
            className={`${styles.navButton} ${
              currentView === 'users' ? styles.active : ''
            }`}
            onClick={() => onViewChange('users')}
          >
            Пользователи
          </button>
        </nav>
      </div>

      <div className={styles.right}>
        {currentUser && (
          <div className={styles.user}>
            <span className={styles.userName}>
              {currentUser.first_name} {currentUser.last_name}
            </span>
            <span className={styles.userRole}>{getRoleNameRu(currentUser.role)}</span>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={onLogout}>
          Выход
        </Button>
      </div>
    </header>
  );
};
