import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CloudDownload, FileImage } from 'lucide-react';
import { Callout } from '@/components/ui/Callout';
import { Footer } from '@/components/ui/Footer';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { shareService } from '@/services/shareService';
import { useAuthStore } from '@/stores/authStore';
import { isShareError, type SharedFile } from '@/types/share';
import { formatFileSize } from '@/validation/uploadValidation';
import styles from './DownloadPage.module.css';

type Status =
  | { kind: 'loading' }
  | { kind: 'ready'; file: SharedFile }
  | { kind: 'not-found' }
  | { kind: 'error'; message: string };

export function DownloadPage() {
  const { token } = useParams<{ token: string }>();
  const isAuthenticated = useAuthStore((s) => s.token !== null);

  const [status, setStatus] = useState<Status>({ kind: 'loading' });

  useEffect(() => {
    if (!token) {
      setStatus({ kind: 'not-found' });
      return;
    }

    let cancelled = false;
    setStatus({ kind: 'loading' });

    shareService
      .getMetadata(token)
      .then((file) => {
        if (!cancelled) setStatus({ kind: 'ready', file });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isShareError(err) && err.kind === 'not-found') {
          setStatus({ kind: 'not-found' });
        } else {
          const message = isShareError(err)
            ? err.message
            : 'Une erreur est survenue.';
          setStatus({ kind: 'error', message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className={styles.page}>
      <Header>
        {isAuthenticated ? (
          <Link to="/upload">
            <Button variant="action">Mon espace</Button>
          </Link>
        ) : (
          <Link to="/login">
            <Button variant="action">Se connecter</Button>
          </Link>
        )}
      </Header>

      <main className={styles.main}>
        <div className={styles.card}>
          <h1 className={styles.title}>Télécharger un fichier</h1>

          {status.kind === 'loading' && (
            <div className={styles.skeleton} aria-label="Chargement…" role="status" />
          )}

          {status.kind === 'not-found' && (
            <Callout variant="error">
              Le lien est invalide ou le fichier n'est plus disponible.
            </Callout>
          )}

          {status.kind === 'error' && (
            <Callout variant="error">{status.message}</Callout>
          )}

          {status.kind === 'ready' && token && (
            <>
              <div className={styles.fileRow}>
                <FileImage
                  className={styles.fileIcon}
                  size={28}
                  aria-hidden="true"
                />
                <div className={styles.fileMeta}>
                  <span className={styles.fileName}>{status.file.name}</span>
                  <span className={styles.fileSize}>
                    {formatFileSize(status.file.sizeBytes)}
                  </span>
                </div>
              </div>

              <div className={styles.actions}>
                <a
                  className={styles.downloadButton}
                  href={shareService.buildDownloadUrl(token)}
                  download={status.file.name}
                  rel="noreferrer"
                >
                  <CloudDownload size={18} aria-hidden="true" />
                  Télécharger
                </a>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
