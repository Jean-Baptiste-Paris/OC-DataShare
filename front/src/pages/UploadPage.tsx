import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Footer } from '@/components/ui/Footer';
import { Header } from '@/components/ui/Header';
import { useAuthStore } from '@/stores/authStore';
import styles from './UploadPage.module.css';

export function UploadPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className={styles.page}>
      <Header>
        <Button variant="action" onClick={handleLogout}>
          Se déconnecter
        </Button>
      </Header>

      <main className={styles.main}>
        <div className={styles.card}>
          <h1 className={styles.title}>Téléversement</h1>
          <p className={styles.placeholder}>
            Page de téléversement à venir (US01).
            {user && ` Connecté en tant que ${user.email}.`}
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
