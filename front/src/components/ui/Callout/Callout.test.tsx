import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Callout } from './Callout';

describe('Callout', () => {
  it('rend le contenu du callout', () => {
    render(<Callout variant="info">Vérifiez votre boîte mail</Callout>);
    expect(screen.getByText('Vérifiez votre boîte mail')).toBeInTheDocument();
  });

  it('expose role="status" pour le variant info (annonce polie)', () => {
    render(<Callout variant="info">Information</Callout>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('expose role="alert" pour les variants warning et error (annonce assertive)', () => {
    const { rerender } = render(<Callout variant="warning">Attention</Callout>);
    expect(screen.getByRole('alert')).toBeInTheDocument();

    rerender(<Callout variant="error">Erreur</Callout>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
