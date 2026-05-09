import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Style visuel du bouton */
  variant?: 'primary' | 'secondary' | 'borderless' | 'action';
  /** Contenu du bouton (texte, icône, ou les deux par composition) */
  children: ReactNode;
}

/**
 * Bouton du design system DataShare.
 * 4 variants : primary (action principale corail), secondary (action alternative outlined),
 * borderless (lien-like), action (CTA sombre header).
 */
export function Button({
  variant = 'primary',
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = [styles.button, styles[variant], className]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
