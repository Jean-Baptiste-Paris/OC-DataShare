import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CloudUpload,
  File as FileIcon,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  LogOut,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Sidebar, SidebarTrigger } from '@/components/ui/Sidebar';
import { Switch } from '@/components/ui/Switch';
import { fileService } from '@/services/fileService';
import { useAuthStore } from '@/stores/authStore';
import {
  isFileDeleteError,
  isFileListError,
  type FileSummary,
} from '@/types/file';
import styles from './MyFilesPage.module.css';

type Status =
  | { kind: 'loading' }
  | { kind: 'ready'; files: FileSummary[] }
  | { kind: 'error'; message: string };

type Filter = 'all' | 'available' | 'deleted';

const FILTER_OPTIONS = [
  { value: 'all', label: 'Tous' },
  { value: 'available', label: 'Actifs' },
  { value: 'deleted', label: 'Expirés' },
];

export function MyFilesPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const [status, setStatus] = useState<Status>({ kind: 'loading' });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    let cancelled = false;
    setStatus({ kind: 'loading' });

    fileService
      .list()
      .then((files) => {
        if (!cancelled) setStatus({ kind: 'ready', files });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isFileListError(err) && err.kind === 'unauthorized') {
          navigate('/login', { replace: true });
          return;
        }
        const message = isFileListError(err)
          ? err.message
          : 'Une erreur est survenue.';
        setStatus({ kind: 'error', message });
      });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleDelete = async (id: string) => {
    if (status.kind !== 'ready') return;

    // Optimistic update : on flippe localement le statut → 'deleted'.
    const previous = status.files;
    const optimistic = previous.map((f) =>
      f.id === id ? { ...f, status: 'deleted' as const } : f,
    );
    setStatus({ kind: 'ready', files: optimistic });

    try {
      await fileService.delete(id);
    } catch (err) {
      if (isFileDeleteError(err) && err.kind === 'unauthorized') {
        navigate('/login', { replace: true });
        return;
      }
      // Rollback : si le back échoue, on restaure l'état précédent.
      setStatus({ kind: 'ready', files: previous });
    }
  };

  return (
    <div className={styles.layout}>
      <Sidebar
        items={[
          {
            label: 'Mes fichiers',
            to: '/files',
            active: true,
          },
        ]}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onLogout={handleLogout}
      />

      <main className={styles.content}>
        <div className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <SidebarTrigger onClick={() => setDrawerOpen(true)} />
          </div>
          {/* Mobile : bouton icône upload compact à droite (le label long
              "Ajouter des fichiers" ne tient pas en mobile, et l'item drawer
              a été retiré pour rester fidèle à la maquette). */}
          <button
            type="button"
            className={styles.uploadIconButton}
            onClick={() => navigate('/upload')}
            aria-label="Ajouter des fichiers"
          >
            <CloudUpload size={20} aria-hidden="true" />
          </button>
          <div className={styles.topbarActions}>
            <Button
              variant="action"
              onClick={() => navigate('/upload')}
              aria-label="Ajouter des fichiers"
            >
              <CloudUpload size={18} aria-hidden="true" />
              Ajouter des fichiers
            </Button>
            <button
              type="button"
              className={styles.logoutButton}
              onClick={handleLogout}
            >
              <LogOut size={16} aria-hidden="true" />
              Déconnexion
            </button>
          </div>
        </div>

        <div className={styles.section}>
          <h1 className={styles.title}>Mes fichiers</h1>

          {status.kind === 'loading' && (
            <div className={styles.fileList}>
              <div className={styles.skeleton} aria-label="Chargement…" role="status" />
              <div className={styles.skeleton} aria-hidden="true" />
              <div className={styles.skeleton} aria-hidden="true" />
            </div>
          )}

          {status.kind === 'error' && (
            <Callout variant="error">{status.message}</Callout>
          )}

          {status.kind === 'ready' && (
            <>
              <div className={styles.switchWrap}>
                <Switch
                  options={FILTER_OPTIONS}
                  value={filter}
                  onValueChange={(v) => setFilter(v as Filter)}
                  ariaLabel="Filtrer par statut"
                />
              </div>

              {status.files.length === 0 && (
                <p className={styles.empty}>
                  Tu n'as pas encore partagé de fichier.
                </p>
              )}

              {status.files.length > 0 && (
                <div className={styles.fileList}>
                  {status.files
                    .filter((f) => filter === 'all' || f.status === filter)
                    .map((file) => (
                      <div
                        key={file.id}
                        className={[
                          styles.fileRow,
                          file.status === 'deleted' ? styles.fileRowDeleted : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        <span className={styles.fileIcon} aria-hidden="true">
                          {iconForMimeType(file.mimeType)}
                        </span>
                        <div className={styles.fileMeta}>
                          <span className={styles.fileName}>{file.name}</span>
                          {file.status === 'available' ? (
                            <span className={styles.fileSubline}>
                              Envoyé le {formatDate(file.createdAt)}
                            </span>
                          ) : (
                            <span className={styles.fileStatusDeleted}>
                              Expiré
                            </span>
                          )}
                        </div>

                        {file.status === 'available' ? (
                          <>
                            {/* Desktop : 2 boutons inline */}
                            <div className={styles.fileActions}>
                              <button
                                type="button"
                                className={styles.deleteButton}
                                onClick={() => handleDelete(file.id)}
                                aria-label={`Supprimer ${file.name}`}
                              >
                                <Trash2 size={16} aria-hidden="true" />
                                Supprimer
                              </button>
                              <a
                                className={styles.accessLink}
                                href={`/d/${file.id}`}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={`Accéder au lien de partage de ${file.name}`}
                              >
                                Accéder
                                <ArrowRight size={16} aria-hidden="true" />
                              </a>
                            </div>
                            {/* Mobile : kebab menu */}
                            <div className={styles.fileActionsMobile}>
                              <DropdownMenu
                                ariaLabel={`Actions sur ${file.name}`}
                                items={[
                                  {
                                    label: 'Accéder',
                                    icon: <ArrowRight size={14} aria-hidden="true" />,
                                    onSelect: () =>
                                      window.open(`/d/${file.id}`, '_blank', 'noreferrer'),
                                  },
                                  {
                                    label: 'Supprimer',
                                    icon: <Trash2 size={14} aria-hidden="true" />,
                                    onSelect: () => handleDelete(file.id),
                                    destructive: true,
                                  },
                                ]}
                              />
                            </div>
                          </>
                        ) : (
                          <span className={styles.fileTrailing}>
                            Ce fichier a expiré, il n'est plus stocké chez nous.
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function iconForMimeType(mimeType: string): ReactNode {
  if (mimeType.startsWith('image/')) return <FileImage size={28} />;
  if (mimeType.startsWith('audio/')) return <FileAudio size={28} />;
  if (mimeType.startsWith('video/')) return <FileVideo size={28} />;
  if (mimeType === 'application/pdf' || mimeType.startsWith('text/'))
    return <FileText size={28} />;
  return <FileIcon size={28} />;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
