import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DropdownMenu } from './DropdownMenu';

describe('DropdownMenu', () => {
  it('rend un bouton trigger avec aria-label', () => {
    render(
      <DropdownMenu
        ariaLabel="Actions sur fichier"
        items={[{ label: 'Action', onSelect: vi.fn() }]}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Actions sur fichier' }),
    ).toBeInTheDocument();
  });

  it("ouvre le menu au clic sur le trigger et appelle onSelect au clic d'item", async () => {
    const onAccess = vi.fn();
    const onDelete = vi.fn();
    const user = userEvent.setup();

    render(
      <DropdownMenu
        ariaLabel="Actions sur cv.pdf"
        items={[
          { label: 'Accéder', onSelect: onAccess },
          { label: 'Supprimer', onSelect: onDelete, destructive: true },
        ]}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Actions sur cv.pdf' }));

    expect(screen.getByRole('menuitem', { name: 'Accéder' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Supprimer' })).toBeInTheDocument();

    await user.click(screen.getByRole('menuitem', { name: 'Supprimer' }));
    expect(onDelete).toHaveBeenCalledOnce();
    expect(onAccess).not.toHaveBeenCalled();
  });
});
