import { useId, type ReactNode } from 'react';
import * as RadixSelect from '@radix-ui/react-select';
import { ChevronDown, Check } from 'lucide-react';
import styles from './Select.module.css';

export interface SelectOption {
  /** Valeur programmatique */
  value: string;
  /** Libellé affiché à l'utilisateur */
  label: ReactNode;
}

export interface SelectProps {
  /** Libellé affiché au-dessus du select */
  label: string;
  /** Liste des options du dropdown */
  options: SelectOption[];
  /** Valeur sélectionnée (contrôlé) */
  value: string;
  /** Callback déclenché au changement de sélection */
  onValueChange: (value: string) => void;
  /** Texte affiché quand aucune valeur n'est sélectionnée */
  placeholder?: string;
  /** Désactive le select */
  disabled?: boolean;
}

/**
 * Dropdown de sélection du design system DataShare.
 * Implémenté via @radix-ui/react-select : a11y industrielle (flèches haut/bas,
 * Home/End, Échap, type-ahead, click-outside, focus trap, portal).
 */
export function Select({
  label,
  options,
  value,
  onValueChange,
  placeholder,
  disabled,
}: SelectProps) {
  const id = useId();

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
        <RadixSelect.Trigger id={id} className={styles.trigger}>
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon className={styles.icon}>
            <ChevronDown size={16} strokeWidth={1.75} />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>
        <RadixSelect.Portal>
          <RadixSelect.Content
            className={styles.content}
            position="popper"
            sideOffset={4}
          >
            <RadixSelect.Viewport className={styles.viewport}>
              {options.map((option) => (
                <RadixSelect.Item
                  key={option.value}
                  value={option.value}
                  className={styles.item}
                >
                  <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                  <RadixSelect.ItemIndicator className={styles.indicator}>
                    <Check size={14} strokeWidth={2} />
                  </RadixSelect.ItemIndicator>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
    </div>
  );
}
