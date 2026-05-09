import { useId, type InputHTMLAttributes } from 'react';
import styles from './Input.module.css';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Libellé affiché au-dessus du champ */
  label: string;
  /** Texte d'aide affiché sous le champ (gris) */
  helperText?: string;
  /** Message d'erreur affiché sous le champ (rouge), prend le pas sur helperText */
  error?: string;
}

/**
 * Champ de saisie texte du design system DataShare.
 * Anatomie : label au-dessus, input, helper/error en dessous.
 * Accessibilité : label lié via htmlFor, helper/error annoncés via aria-describedby.
 */
export function Input({
  label,
  helperText,
  error,
  className,
  id: externalId,
  ...rest
}: InputProps) {
  const generatedId = useId();
  const id = externalId ?? generatedId;
  const descriptionId = helperText || error ? `${id}-description` : undefined;
  const hasError = Boolean(error);

  const inputClasses = [styles.input, hasError ? styles.inputError : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <input
        id={id}
        aria-invalid={hasError || undefined}
        aria-describedby={descriptionId}
        className={inputClasses}
        {...rest}
      />
      {(error || helperText) && (
        <p
          id={descriptionId}
          className={hasError ? styles.errorText : styles.helperText}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
}
