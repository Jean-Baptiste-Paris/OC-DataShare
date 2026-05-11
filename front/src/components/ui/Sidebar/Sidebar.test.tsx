import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar, SidebarTrigger } from './Sidebar';

function renderSidebar(props: Partial<React.ComponentProps<typeof Sidebar>> = {}) {
  const onClose = vi.fn();
  const utils = render(
    <MemoryRouter>
      <Sidebar
        items={[{ label: 'Mes fichiers', to: '/files', active: true }]}
        onClose={onClose}
        {...props}
      />
    </MemoryRouter>,
  );
  return { ...utils, onClose };
}

describe('Sidebar', () => {
  it("rend le copyright en bas, sans bloc utilisateur ni bouton logout (cf. NOTES.md, maquette)", () => {
    renderSidebar();
    expect(screen.getByText(/Copyright DataShare/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Se déconnecter|Déconnexion/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Claire Marie/i)).not.toBeInTheDocument();
  });

  it("rend chaque item de navigation avec aria-current='page' quand actif", () => {
    renderSidebar({
      items: [
        { label: 'Mes fichiers', to: '/files', active: true },
        { label: 'Paramètres', to: '/settings' },
      ],
    });
    const active = screen.getByRole('link', { name: 'Mes fichiers' });
    expect(active).toHaveAttribute('aria-current', 'page');
    const inactive = screen.getByRole('link', { name: 'Paramètres' });
    expect(inactive).not.toHaveAttribute('aria-current');
  });

  it('appelle onClose à la touche ESC quand le drawer est ouvert', () => {
    const { onClose } = renderSidebar({ isOpen: true });
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("n'appelle pas onClose à ESC quand le drawer est fermé", () => {
    const { onClose } = renderSidebar({ isOpen: false });
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("appelle onClose au clic sur le bouton 'Fermer le menu'", async () => {
    const user = userEvent.setup();
    const { onClose } = renderSidebar({ isOpen: true });
    await user.click(screen.getByRole('button', { name: 'Fermer le menu' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe('SidebarTrigger', () => {
  it('appelle onClick au clic sur le hamburger', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<SidebarTrigger onClick={onClick} />);
    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
