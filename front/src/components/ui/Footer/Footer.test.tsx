import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Footer } from './Footer';

describe('Footer', () => {
  it('rend un élément contentinfo (footer)', () => {
    render(<Footer />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('affiche le copyright DataShare', () => {
    render(<Footer />);
    expect(screen.getByText(/Copyright DataShare/)).toBeInTheDocument();
  });
});
