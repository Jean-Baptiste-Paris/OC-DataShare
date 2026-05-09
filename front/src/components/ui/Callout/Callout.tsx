import type { ReactNode } from 'react';
import { Info, AlertTriangle, XCircle } from 'lucide-react';
import styles from './Callout.module.css';

type CalloutVariant = 'info' | 'warning' | 'error';

export interface CalloutProps {
  /** Sémantique du callout — détermine couleur, icône et politesse a11y */
  variant: CalloutVariant;
  /** Contenu textuel du message */
  children: ReactNode;
}

const ICONS = {
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
} as const;

/**
 * Bandeau d'information du design system DataShare.
 * 3 variants : info (bleu, polite), warning (orange, alert), error (rouge, alert).
 * Icônes fournies par lucide-react (taille et stroke uniformes par construction).
 */
export function Callout({ variant, children }: CalloutProps) {
  const role = variant === 'info' ? 'status' : 'alert';
  const Icon = ICONS[variant];
  return (
    <div className={`${styles.callout} ${styles[variant]}`} role={role}>
      <span className={styles.icon} aria-hidden="true">
        <Icon size={16} strokeWidth={1.75} />
      </span>
      <span className={styles.content}>{children}</span>
    </div>
  );
}
