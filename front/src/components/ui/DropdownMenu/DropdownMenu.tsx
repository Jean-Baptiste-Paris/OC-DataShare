import type { ReactNode } from 'react';
import * as RadixDropdown from '@radix-ui/react-dropdown-menu';
import { MoreVertical } from 'lucide-react';
import styles from './DropdownMenu.module.css';

export interface DropdownMenuItem {
  /** Libellé affiché dans le menu */
  label: ReactNode;
  /** Icône optionnelle à gauche du label */
  icon?: ReactNode;
  /** Action déclenchée au clic */
  onSelect: () => void;
  /** Style destructif (rouge) — pour suppression et autres actions irréversibles */
  destructive?: boolean;
}

export interface DropdownMenuProps {
  items: DropdownMenuItem[];
  /** Étiquette du trigger pour les lecteurs d'écran (ex. "Actions sur cv.pdf") */
  ariaLabel: string;
}

/**
 * Menu d'actions contextuel — déclenché par un bouton kebab (3 points verticaux).
 * Utilisé sur les file rows en mobile pour condenser les actions Supprimer / Accéder.
 *
 * Construit sur @radix-ui/react-dropdown-menu : focus management, ESC, click outside,
 * et navigation clavier (flèches haut/bas) sont fournis par la lib.
 */
export function DropdownMenu({ items, ariaLabel }: DropdownMenuProps) {
  return (
    <RadixDropdown.Root>
      <RadixDropdown.Trigger asChild>
        <button type="button" className={styles.trigger} aria-label={ariaLabel}>
          <MoreVertical size={18} aria-hidden="true" />
        </button>
      </RadixDropdown.Trigger>
      <RadixDropdown.Portal>
        <RadixDropdown.Content
          className={styles.content}
          align="end"
          sideOffset={4}
        >
          {items.map((item, index) => (
            <RadixDropdown.Item
              key={index}
              className={[styles.item, item.destructive ? styles.destructive : '']
                .filter(Boolean)
                .join(' ')}
              onSelect={item.onSelect}
            >
              {item.icon}
              <span>{item.label}</span>
            </RadixDropdown.Item>
          ))}
        </RadixDropdown.Content>
      </RadixDropdown.Portal>
    </RadixDropdown.Root>
  );
}
