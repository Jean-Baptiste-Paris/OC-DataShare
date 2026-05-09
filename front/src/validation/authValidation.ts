export type RegisterFormValues = {
  email: string;
  password: string;
  passwordConfirm: string;
};

export type RegisterFormErrors = Partial<Record<keyof RegisterFormValues, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX_LENGTH = 254;
const PASSWORD_MIN_LENGTH = 8;

export function validateRegisterForm(values: RegisterFormValues): RegisterFormErrors {
  const errors: RegisterFormErrors = {};

  const email = values.email.trim();
  if (email === '') {
    errors.email = "L'email est obligatoire.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Format d'email invalide.";
  } else if (email.length > EMAIL_MAX_LENGTH) {
    errors.email = `L'email ne peut pas dépasser ${EMAIL_MAX_LENGTH} caractères.`;
  }

  if (values.password === '') {
    errors.password = 'Le mot de passe est obligatoire.';
  } else if (values.password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Le mot de passe doit faire au moins ${PASSWORD_MIN_LENGTH} caractères.`;
  }

  if (values.passwordConfirm === '') {
    errors.passwordConfirm = 'La confirmation est obligatoire.';
  } else if (values.passwordConfirm !== values.password) {
    errors.passwordConfirm = 'Les deux mots de passe ne correspondent pas.';
  }

  return errors;
}

export function isFormValid(errors: RegisterFormErrors): boolean {
  return Object.keys(errors).length === 0;
}
