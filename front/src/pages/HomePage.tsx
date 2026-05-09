import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <main style={{ padding: '2rem' }}>
      <h1>DataShare</h1>
      <p>Application de partage de fichiers sécurisé. Pages à venir.</p>
      <p>
        <Link to="/design-system">→ Voir le design system</Link>
      </p>
    </main>
  );
}
