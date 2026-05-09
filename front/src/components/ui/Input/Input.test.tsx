import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Input } from './Input';

describe('Input', () => {
  it('rend le label associé au champ via htmlFor / id', () => {
    render(<Input label="Email" />);
    const input = screen.getByLabelText('Email');
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe('INPUT');
  });

  it('appelle onChange quand on tape dans le champ', async () => {
    const onChange = vi.fn();
    render(<Input label="Email" onChange={onChange} />);
    await userEvent.type(screen.getByLabelText('Email'), 'a');
    expect(onChange).toHaveBeenCalled();
  });

  it("affiche le message d'erreur et marque le champ comme invalide", () => {
    render(<Input label="Email" error="Cet email est invalide" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Cet email est invalide')).toBeInTheDocument();
  });

  it('affiche helperText si pas d\'erreur', () => {
    render(<Input label="Mot de passe" helperText="8 caractères minimum" />);
    expect(screen.getByText('8 caractères minimum')).toBeInTheDocument();
    expect(screen.getByLabelText('Mot de passe')).not.toHaveAttribute(
      'aria-invalid',
    );
  });
});
