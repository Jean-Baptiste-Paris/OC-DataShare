import type { ReactNode } from 'react';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import styles from './Switch.module.css';

export interface SwitchOption {
  /** Valeur programmatique (ex. 'all' / 'available' / 'deleted') */
  value: string;
  /** Libellé affiché à l'utilisateur */
  label: ReactNode;
}

export interface SwitchProps {
  /** Liste des segments à afficher (mutuellement exclusifs) */
  options: SwitchOption[];
  /** Valeur actuellement sélectionnée */
  value: string;
  /** Callback déclenché lorsqu'une autre option est choisie */
  onValueChange: (value: string) => void;
  /** Étiquette du groupe pour les lecteurs d'écran */
  ariaLabel: string;
}

/**
 * Segmented control du design system DataShare (3 positions ou plus, sélection exclusive).
 * Bien que nommé "Switch" pour cohérence avec la maquette, le comportement est celui
 * d'un toggle group (radio-like) — implémenté via @radix-ui/react-toggle-group.
 *
 * Note a11y : le texte du segment sélectionné est blanc sur fond corail, ratio de
 * contraste ~2.92 (en dessous du seuil AA 4.5:1). Écart conscient pour fidélité maquette,
 * documenté dans TESTING.md.
 */
export function Switch({ options, value, onValueChange, ariaLabel }: SwitchProps) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={(v) => {
        // Radix retourne '' si l'utilisateur déselectionne — on ignore pour rester exclusif
        if (v) onValueChange(v);
      }}
      aria-label={ariaLabel}
      className={styles.root}
    >
      {options.map((option) => (
        <ToggleGroup.Item
          key={option.value}
          value={option.value}
          className={styles.item}
        >
          {option.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
