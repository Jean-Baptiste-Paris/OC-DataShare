import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Footer } from '@/components/ui/Footer';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';
import {
  isLoginFormValid,
  validateLoginForm,
  type LoginFormErrors,
  type LoginFormValues,
} from '@/validation/authValidation';
import styles from './LoginPage.module.css';

type LocationState = { flashSuccess?: string } | null;

const INITIAL_VALUES: LoginFormValues = { email: '', password: '' };

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const flashSuccess = (location.state as LocationState)?.flashSuccess;

  const status = useAuthStore((s) => s.loginStatus);
  const error = useAuthStore((s) => s.loginError);
  const token = useAuthStore((s) => s.token);
  const login = useAuthStore((s) => s.login);
  const reset = useAuthStore((s) => s.resetLogin);

  const [values, setValues] = useState<LoginFormValues>(INITIAL_VALUES);
  const [clientErrors, setClientErrors] = useState<LoginFormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (token) {
      navigate('/upload', { replace: true });
    }
  }, [token, navigate]);

  useEffect(() => () => reset(), [reset]);

  const handleChange =
    (field: keyof LoginFormValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
      if (status === 'error') reset();
    };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    const errors = validateLoginForm(values);
    setClientErrors(errors);
    if (!isLoginFormValid(errors)) return;
    void login({ email: values.email.trim(), password: values.password });
  };

  const fieldErrors = submitted ? clientErrors : {};
  const globalError = error?.message ?? null;
  const isPending = status === 'pending';

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
          {globalError && <Callout variant="error">{globalError}</Callout>}

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="Saisissez votre email..."
              value={values.email}
              onChange={handleChange('email')}
              error={fieldErrors.email}
              disabled={isPending}
              required
            />
            <Input
              label="Mot de passe"
              type="password"
              autoComplete="current-password"
              placeholder="Saisissez votre mot de passe..."
              value={values.password}
              onChange={handleChange('password')}
              error={fieldErrors.password}
              disabled={isPending}
              required
            />

            <div className={styles.actions}>
              <Button
                type="button"
                variant="borderless"
                onClick={() => navigate('/register')}
                disabled={isPending}
              >
                Créer un compte
              </Button>

              <Button type="submit" variant="primary" disabled={isPending}>
                {isPending ? 'Connexion…' : 'Se connecter'}
              </Button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
