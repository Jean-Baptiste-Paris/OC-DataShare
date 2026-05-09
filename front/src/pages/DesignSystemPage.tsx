import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Header } from '@/components/ui/Header';
import { Callout } from '@/components/ui/Callout';
import { Switch } from '@/components/ui/Switch';

export function DesignSystemPage() {
  const [filter, setFilter] = useState('all');

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
        <p style={{ color: 'var(--color-text-muted)' }}>
          4 variants : primary, secondary, borderless, action.
        </p>

        <h3 style={{ marginTop: '1rem', fontSize: 'var(--font-size-base)' }}>État normal</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <Button variant="primary">Téléverser</Button>
          <Button variant="secondary">Téléverser</Button>
          <Button variant="borderless">Téléverser</Button>
          <Button variant="action">Téléverser</Button>
        </div>

        <h3 style={{ marginTop: '1rem', fontSize: 'var(--font-size-base)' }}>État désactivé</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <Button variant="primary" disabled>Téléverser</Button>
          <Button variant="secondary" disabled>Téléverser</Button>
          <Button variant="borderless" disabled>Téléverser</Button>
          <Button variant="action" disabled>Téléverser</Button>
        </div>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Input</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Champ texte avec label, helper text et état d'erreur.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '320px' }}>
          <Input label="Email" type="email" placeholder="vous@exemple.fr" />
          <Input
            label="Mot de passe"
            type="password"
            helperText="8 caractères minimum"
          />
          <Input
            label="Email"
            type="email"
            defaultValue="invalide"
            error="Cet email est déjà utilisé"
          />
          <Input label="Champ désactivé" disabled defaultValue="Lecture seule" />
        </div>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Header</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Logo à gauche, slot CTA à droite. Le state d'auth est porté par la page consommatrice.
          Responsive via <code>@media</code> (viewport &lt; 768px) et <code>@container</code> (preview ci-dessous).
        </p>

        <h3 style={{ marginTop: '1rem', fontSize: 'var(--font-size-base)' }}>Desktop — sans CTA</h3>
        <div style={{ border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)' }}>
          <Header />
        </div>

        <h3 style={{ marginTop: '1rem', fontSize: 'var(--font-size-base)' }}>Desktop — « Se connecter »</h3>
        <div style={{ border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)' }}>
          <Header>
            <Button variant="action">Se connecter</Button>
          </Header>
        </div>

        <h3 style={{ marginTop: '1rem', fontSize: 'var(--font-size-base)' }}>Desktop — « Mon espace »</h3>
        <div style={{ border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)' }}>
          <Header>
            <Button variant="action">Mon espace</Button>
          </Header>
        </div>

        <h3 style={{ marginTop: '1rem', fontSize: 'var(--font-size-base)' }}>Mobile — preview via <code>@container</code></h3>
        <div
          style={{
            containerType: 'inline-size',
            maxWidth: '375px',
            border: '1px dashed var(--color-border)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <Header>
            <Button variant="action">Se connecter</Button>
          </Header>
        </div>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Callout</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Bandeaux d'information avec sémantique a11y (status/alert).
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Callout variant="info">Vérifiez votre boîte mail pour activer votre compte</Callout>
          <Callout variant="warning">Le lien expirera dans 7 jours</Callout>
          <Callout variant="error">Email ou mot de passe incorrect</Callout>
        </div>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Switch</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Segmented control (toggle group avec sélection exclusive). Implémentation Radix.
        </p>

        <Switch
          options={[
            { value: 'all', label: 'Tous' },
            { value: 'available', label: 'Actifs' },
            { value: 'deleted', label: 'Supprimés' },
          ]}
          value={filter}
          onValueChange={setFilter}
          ariaLabel="Filtre des fichiers"
        />

        <p style={{ marginTop: '0.5rem', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          Valeur courante : <code>{filter}</code>
        </p>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Select</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>À venir.</p>
      </section>
    </main>
  );
}
