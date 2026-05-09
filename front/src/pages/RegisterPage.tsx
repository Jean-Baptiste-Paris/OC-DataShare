import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Footer } from '@/components/ui/Footer';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';
import {
  isFormValid,
  validateRegisterForm,
  type RegisterFormErrors,
  type RegisterFormValues,
} from '@/validation/authValidation';
import styles from './RegisterPage.module.css';

const INITIAL_VALUES: RegisterFormValues = {
  email: '',
  password: '',
  passwordConfirm: '',
};

export function RegisterPage() {
  const navigate = useNavigate();
  const status = useAuthStore((s) => s.status);
  const error = useAuthStore((s) => s.error);
  const register = useAuthStore((s) => s.register);
  const reset = useAuthStore((s) => s.reset);

  const [values, setValues] = useState<RegisterFormValues>(INITIAL_VALUES);
  const [clientErrors, setClientErrors] = useState<RegisterFormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (status === 'success') {
      reset();
      navigate('/login', {
        replace: true,
        state: { flashSuccess: 'Compte créé. Connecte-toi pour continuer.' },
      });
    }
  }, [status, navigate, reset]);

  // Reset le store au démontage pour éviter qu'un statut error persiste sur retour à la page.
  useEffect(() => () => reset(), [reset]);

  const handleChange =
    (field: keyof RegisterFormValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
      if (status === 'error') reset();
    };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    const errors = validateRegisterForm(values);
    setClientErrors(errors);
    if (!isFormValid(errors)) return;
    void register({ email: values.email.trim(), password: values.password });
  };

  const fieldErrors = useMemo<RegisterFormErrors>(() => {
    if (!submitted) return {};
    const serverFieldErrors =
      error?.kind === 'validation' ? error.fieldErrors : {};
    return { ...serverFieldErrors, ...clientErrors };
  }, [submitted, error, clientErrors]);

  const emailFieldError =
    error?.kind === 'email-already-taken' ? error.message : fieldErrors.email;

  const globalError =
    error?.kind === 'email-already-taken' || error?.kind === 'network'
      ? error.message
      : null;

  const isPending = status === 'pending';

  return (
    <div className={styles.page}>
      <Header>
        <Button variant="action" onClick={() => navigate('/login')}>
          Se connecter
        </Button>
      </Header>

      <main className={styles.main}>
        <div className={styles.card}>
          <h1 className={styles.title}>Créer un compte</h1>

          {globalError && <Callout variant="error">{globalError}</Callout>}

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="Saisissez votre email..."
              value={values.email}
              onChange={handleChange('email')}
              error={emailFieldError}
              disabled={isPending}
              required
            />
            <Input
              label="Mot de passe"
              type="password"
              autoComplete="new-password"
              placeholder="Saisissez votre mot de passe..."
              value={values.password}
              onChange={handleChange('password')}
              error={fieldErrors.password}
              disabled={isPending}
              required
              minLength={8}
            />
            <Input
              label="Vérification du mot de passe"
              type="password"
              autoComplete="new-password"
              placeholder="Saisissez le à nouveau"
              value={values.passwordConfirm}
              onChange={handleChange('passwordConfirm')}
              error={fieldErrors.passwordConfirm}
              disabled={isPending}
              required
            />

            <div className={styles.actions}>
              <Button
                type="button"
                variant="borderless"
                onClick={() => navigate('/login')}
                disabled={isPending}
              >
                J'ai déjà un compte
              </Button>

              <Button type="submit" variant="primary" disabled={isPending}>
                {isPending ? 'Création…' : 'Créer un compte'}
              </Button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
