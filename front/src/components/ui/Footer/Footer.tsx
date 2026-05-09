import styles from './Footer.module.css';

/**
 * Pied de page global du design system DataShare.
 * Affiche le copyright sur fond transparent (consomme la couleur du parent).
 * Symétrique du Header en padding pour s'aligner verticalement avec lui.
 */
export function Footer() {
  return (
    <footer className={styles.footer}>
      Copyright DataShare© 2025
    </footer>
  );
}
