import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import styles from './Sidebar.module.css';

export interface SidebarItem {
  label: string;
  to: string;
  icon?: React.ReactNode;
  active?: boolean;
  /** Visible uniquement en mode mobile (drawer). Sans effet sur l'item actif. */
  mobileOnly?: boolean;
}

export interface SidebarProps {
  items: SidebarItem[];
  /** Mobile only — état d'ouverture du drawer. Sans effet en desktop. */
  isOpen?: boolean;
  /** Mobile only — callback de fermeture du drawer. */
  onClose?: () => void;
  /**
   * Action de déconnexion. Si fournie, un bouton « Se déconnecter » s'affiche
   * en bas de la sidebar — masqué en desktop via media query (le logout est
   * porté par la topbar des pages hôtes en desktop).
   */
  onLogout?: () => void;
}

/**
 * Navigation latérale du DS.
 * - Desktop (≥ 769px) : sidebar fixe à gauche, fond gradient corail.
 * - Mobile (≤ 768px) : drawer overlay déclenché par un bouton hamburger
 *   (rendu en haut à gauche du contenu de la page hôte). ESC + clic overlay
 *   ferment le drawer.
 *
 * Pas d'affichage utilisateur (email/avatar) ni de bouton logout dans la
 * sidebar — l'email du user n'est pas exposé en MVP (cf. NOTES.md), le logout
 * est porté par la topbar de la page hôte.
 */
export function Sidebar({ items, isOpen = false, onClose, onLogout }: SidebarProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Drawer mobile : ESC ferme + focus sur la croix à l'ouverture.
  useEffect(() => {
    if (!isOpen || !onClose) return;

    closeButtonRef.current?.focus();

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const sidebarClasses = [styles.sidebar, isOpen ? styles.open : '']
    .filter(Boolean)
    .join(' ');
  const overlayClasses = [styles.overlay, isOpen ? styles.open : '']
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <div
        className={overlayClasses}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={sidebarClasses}
        aria-label="Navigation principale"
        aria-hidden={!isOpen ? undefined : false}
      >
        <div className={styles.drawerHeader}>
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Fermer le menu"
          >
            <X size={24} aria-hidden="true" />
          </button>

          <Link to="/" className={styles.brand}>
            DataShare
          </Link>
        </div>

        <nav className={styles.nav}>
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={[
                styles.navItem,
                item.active ? styles.active : '',
                item.mobileOnly ? styles.mobileOnly : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-current={item.active ? 'page' : undefined}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {onLogout && (
          <button
            type="button"
            className={[styles.navItem, styles.logoutButton, styles.mobileOnly]
              .filter(Boolean)
              .join(' ')}
            onClick={onLogout}
          >
            <LogOut size={16} aria-hidden="true" />
            <span>Se déconnecter</span>
          </button>
        )}

        <div className={styles.copyright}>Copyright DataShare© 2025</div>
      </aside>
    </>
  );
}

/**
 * Bouton hamburger associé. À placer dans le header de la page hôte ; visible
 * uniquement en mobile via media query CSS.
 */
export function SidebarTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className={styles.hamburger}
      onClick={onClick}
      aria-label="Ouvrir le menu"
    >
      <Menu size={20} aria-hidden="true" />
    </button>
  );
}
