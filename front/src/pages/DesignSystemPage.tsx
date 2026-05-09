import { Link } from 'react-router-dom';

export function DesignSystemPage() {
  return (
    <main style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <p>
        <Link to="/">← Retour</Link>
      </p>

      <h1>Design System DataShare</h1>
      <p>Catalogue visuel des composants UI réutilisables. Chaque section sera remplie au fur et à mesure de la construction du DS.</p>

      <section style={{ marginTop: '2rem' }}>
        <h2>Tokens</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Variables définies dans <code>src/styles/theme.css</code>.
        </p>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Button</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>À venir.</p>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Input</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>À venir.</p>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Header</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>À venir.</p>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Callout</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>À venir.</p>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Switch</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>À venir.</p>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Select</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>À venir.</p>
      </section>
    </main>
  );
}
