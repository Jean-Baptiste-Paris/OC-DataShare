import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import styles from './Header.module.css';

export interface HeaderProps {
  /** Slot à droite du header — typiquement un bouton CTA (Se connecter / Mon espace) */
  children?: ReactNode;
}

/**
 * En-tête principal du design system DataShare.
 * Logo DataShare à gauche (lien vers la home), slot enfant à droite (typiquement un CTA).
 * Le header ne gère pas l'état d'auth — c'est la page qui décide quoi rendre dans le slot droit.
 */
export function Header({ children }: HeaderProps) {
  return (
    <header className={styles.header}>
      <Link to="/" className={styles.logo}>
        DataShare
      </Link>
      {children && <div className={styles.actions}>{children}</div>}
    </header>
  );
}
