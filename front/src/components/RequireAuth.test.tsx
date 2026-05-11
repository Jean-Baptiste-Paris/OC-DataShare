import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { RequireAuth } from './RequireAuth';

function renderProtected(initialPath = '/private') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/private"
          element={
            <RequireAuth>
              <div>Contenu privé</div>
            </RequireAuth>
          }
        />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RequireAuth', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, user: null });
  });

  it("redirige vers /login quand aucun token n'est présent", () => {
    renderProtected();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Contenu privé')).not.toBeInTheDocument();
  });

  it('rend les enfants quand un token est présent', () => {
    useAuthStore.setState({
      token: 'jwt-token',
      user: {
        id: 'u-1',
        email: 'foo@bar.fr',
        createdAt: '2026-05-09T10:00:00+00:00',
      },
    });

    renderProtected();
    expect(screen.getByText('Contenu privé')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });
});
