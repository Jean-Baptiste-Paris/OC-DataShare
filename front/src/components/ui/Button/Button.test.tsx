import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('rend le contenu textuel passé en children', () => {
    render(<Button>Téléverser</Button>);
    expect(
      screen.getByRole('button', { name: 'Téléverser' }),
    ).toBeInTheDocument();
  });

  it('appelle onClick quand on clique dessus', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Téléverser</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("n'appelle pas onClick quand le bouton est désactivé", async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Téléverser
      </Button>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
