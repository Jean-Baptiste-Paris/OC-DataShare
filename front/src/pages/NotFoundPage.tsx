import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import styles from './NotFoundPage.module.css';

export function NotFoundPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.token !== null);
  const destination = isAuthenticated ? '/files' : '/login';

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <div className={styles.card}>
          <p className={styles.code}>404</p>
          <h1 className={styles.title}>Page introuvable</h1>
          <p className={styles.subtitle}>
            Cette adresse n'existe pas ou a été déplacée.
          </p>
          <div className={styles.actions}>
            <Button variant="primary" onClick={() => navigate(destination, { replace: true })}>
              Retour à l'accueil
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
