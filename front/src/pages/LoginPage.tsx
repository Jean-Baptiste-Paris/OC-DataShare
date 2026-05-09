import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Footer } from '@/components/ui/Footer';
import { Header } from '@/components/ui/Header';
import styles from './LoginPage.module.css';

type LocationState = { flashSuccess?: string } | null;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const flashSuccess = (location.state as LocationState)?.flashSuccess;

  return (
    <div className={styles.page}>
      <Header>
        <Button variant="action" onClick={() => navigate('/register')}>
          Créer un compte
        </Button>
      </Header>

      <main className={styles.main}>
        <div className={styles.card}>
          <h1 className={styles.title}>Connexion</h1>
          {flashSuccess && <Callout variant="info">{flashSuccess}</Callout>}
          <p className={styles.placeholder}>Page de connexion à venir (US04).</p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
