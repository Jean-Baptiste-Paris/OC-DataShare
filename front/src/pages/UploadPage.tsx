import { useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { CloudUpload, Copy, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Footer } from '@/components/ui/Footer';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { fileService } from '@/services/fileService';
import { useAuthStore } from '@/stores/authStore';
import { isUploadError, type FileSummary } from '@/types/file';
import {
  formatFileSize,
  getUploadValidationMessage,
  validateUploadFile,
} from '@/validation/uploadValidation';
import styles from './UploadPage.module.css';

type Status = 'cta' | 'composing' | 'uploading' | 'success' | 'error';

const V2_TOOLTIP = 'Disponible dans une version ultérieure.';

export function UploadPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<Status>('cta');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState<FileSummary | null>(null);
  const [copied, setCopied] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleOpenForm = () => setStatus('composing');

  const handlePickFile = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    const validationError = validateUploadFile(file);
    if (validationError) {
      setErrorMessage(getUploadValidationMessage(validationError));
      setStatus('error');
      setSelectedFile(null);
      event.target.value = '';
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
    setStatus('composing');
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    setStatus('uploading');
    setErrorMessage(null);

    try {
      const result = await fileService.upload(selectedFile);
      setSummary(result);
      setStatus('success');
    } catch (err) {
      if (isUploadError(err) && err.kind === 'unauthorized') {
        navigate('/login', { replace: true });
        return;
      }
      const message = isUploadError(err) ? err.message : 'Une erreur est survenue.';
      setErrorMessage(message);
      setStatus('error');
    }
  };

  const handleCopyLink = async () => {
    if (!summary) return;
    const link = buildShareLink(summary.id);
    await navigator.clipboard.writeText(link);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const isUploading = status === 'uploading';
  const isSuccess = status === 'success' && summary !== null;
  const showCard = status !== 'cta';

  return (
    <div className={styles.page}>
      <Header>
        <Button variant="action" onClick={handleLogout}>
          Se déconnecter
        </Button>
      </Header>

      <main className={styles.main}>
        {showCard ? (
          <div className={styles.card}>
            <h1 className={styles.title}>Ajouter un fichier</h1>

            {errorMessage && <Callout variant="error">{errorMessage}</Callout>}

            {isSuccess && summary ? (
              <div className={styles.successBlock}>
                <div className={styles.fileRow} aria-live="polite">
                  <FileImage
                    className={styles.fileIcon}
                    size={28}
                    aria-hidden="true"
                  />
                  <div className={styles.fileMeta}>
                    <span className={styles.fileName}>{summary.name}</span>
                    <span className={styles.fileSize}>
                      {formatFileSize(summary.sizeBytes)}
                    </span>
                  </div>
                </div>

                <p className={styles.successMessage}>
                  Félicitations, ton fichier sera conservé chez nous pendant
                  une semaine !
                </p>

                <a
                  className={styles.shareLink}
                  href={buildShareLink(summary.id)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {buildShareLink(summary.id)}
                </a>

                <div className={styles.successActions}>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleCopyLink}
                  >
                    <Copy size={18} aria-hidden="true" />
                    {copied ? 'Lien copié ✓' : 'Copier le lien'}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  className={styles.hiddenInput}
                  onChange={handleFileChange}
                  disabled={isUploading}
                  aria-hidden="true"
                  tabIndex={-1}
                />

                {selectedFile ? (
                  <div className={styles.fileRow}>
                    <FileImage
                      className={styles.fileIcon}
                      size={28}
                      aria-hidden="true"
                    />
                    <div className={styles.fileMeta}>
                      <span className={styles.fileName}>{selectedFile.name}</span>
                      <span className={styles.fileSize}>
                        {formatFileSize(selectedFile.size)}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handlePickFile}
                      disabled={isUploading}
                    >
                      Changer
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handlePickFile}
                    disabled={isUploading}
                  >
                    Choisir un fichier
                  </Button>
                )}

                <div title={V2_TOOLTIP} aria-disabled="true">
                  <Input
                    label="Mot de passe"
                    type="password"
                    placeholder="Disponible en V2"
                    value=""
                    onChange={() => {}}
                    disabled
                  />
                </div>

                <div title={V2_TOOLTIP} aria-disabled="true">
                  <Select
                    label="Expiration"
                    options={[{ value: 'v2', label: 'Disponible en V2' }]}
                    value=""
                    onValueChange={() => {}}
                    placeholder="Disponible en V2"
                    disabled
                  />
                </div>

                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={!selectedFile || isUploading}
                >
                  <CloudUpload size={18} aria-hidden="true" />
                  {isUploading ? 'Téléversement…' : 'Téléverser'}
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className={styles.cta}>
            <p className={styles.ctaText}>Tu veux partager un fichier ?</p>
            <div className={styles.ctaButtonWrap}>
              <span className={styles.ctaButtonHalo} aria-hidden="true" />
              <button
                type="button"
                className={styles.ctaButton}
                onClick={handleOpenForm}
                aria-label="Ouvrir le formulaire de téléversement"
              >
                <CloudUpload size={45} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

function buildShareLink(id: string): string {
  return `${window.location.origin}/d/${id}`;
}
