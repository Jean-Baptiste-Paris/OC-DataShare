import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { Header } from './Header';

const renderInRouter = (ui: React.ReactNode) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe('Header', () => {
  it('rend le logo DataShare en lien vers la home', () => {
    renderInRouter(<Header />);
    const logo = screen.getByRole('link', { name: 'DataShare' });
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('href', '/');
  });

  it('rend les enfants dans le slot droit', () => {
    renderInRouter(
      <Header>
        <button>Se connecter</button>
      </Header>,
    );
    expect(
      screen.getByRole('button', { name: 'Se connecter' }),
    ).toBeInTheDocument();
  });
});
