import { describe, it, expect } from 'vitest';
import {
  isFormValid,
  isLoginFormValid,
  validateLoginForm,
  validateRegisterForm,
} from './authValidation';

describe('validateRegisterForm', () => {
  const valid = {
    email: 'foo@bar.fr',
    password: 'longenough',
    passwordConfirm: 'longenough',
  };

  it("ne renvoie aucune erreur quand tous les champs sont valides", () => {
    expect(validateRegisterForm(valid)).toEqual({});
  });

  it.each([
    ['vide', '', "L'email est obligatoire."],
    ['format invalide', 'not-an-email', "Format d'email invalide."],
    ['format sans tld', 'foo@bar', "Format d'email invalide."],
  ])("renvoie une erreur email quand l'email est %s", (_label, email, expected) => {
    expect(validateRegisterForm({ ...valid, email }).email).toBe(expected);
  });

  it("renvoie une erreur email quand l'email dépasse 254 caractères", () => {
    const longEmail = `${'a'.repeat(250)}@b.fr`;
    expect(validateRegisterForm({ ...valid, email: longEmail }).email).toMatch(
      /254 caractères/,
    );
  });

  it.each([
    ['vide', '', 'Le mot de passe est obligatoire.'],
    ['trop court', 'short', /au moins 8 caractères/],
  ])('renvoie une erreur password quand le password est %s', (_label, password, expected) => {
    const errors = validateRegisterForm({
      ...valid,
      password,
      passwordConfirm: password,
    });
    if (typeof expected === 'string') {
      expect(errors.password).toBe(expected);
    } else {
      expect(errors.password).toMatch(expected);
    }
  });

  it("renvoie une erreur passwordConfirm quand les deux mots de passe diffèrent", () => {
    const errors = validateRegisterForm({
      ...valid,
      passwordConfirm: 'different',
    });
    expect(errors.passwordConfirm).toBe('Les deux mots de passe ne correspondent pas.');
  });

  it("renvoie une erreur passwordConfirm quand la confirmation est vide", () => {
    const errors = validateRegisterForm({ ...valid, passwordConfirm: '' });
    expect(errors.passwordConfirm).toBe('La confirmation est obligatoire.');
  });
});

describe('isFormValid', () => {
  it('retourne true sur un objet vide', () => {
    expect(isFormValid({})).toBe(true);
  });

  it('retourne false dès une clé', () => {
    expect(isFormValid({ email: 'oups' })).toBe(false);
  });
});

describe('validateLoginForm', () => {
  const valid = { email: 'foo@bar.fr', password: 'whatever' };

  it("ne renvoie aucune erreur sur un formulaire valide", () => {
    expect(validateLoginForm(valid)).toEqual({});
  });

  it("renvoie une erreur email obligatoire", () => {
    expect(validateLoginForm({ ...valid, email: '' }).email).toBe(
      "L'email est obligatoire.",
    );
  });

  it("renvoie une erreur format d'email", () => {
    expect(validateLoginForm({ ...valid, email: 'not-an-email' }).email).toBe(
      "Format d'email invalide.",
    );
  });

  it("renvoie une erreur password obligatoire", () => {
    expect(validateLoginForm({ ...valid, password: '' }).password).toBe(
      'Le mot de passe est obligatoire.',
    );
  });

  it("n'impose pas de longueur minimale (autorité côté serveur)", () => {
    expect(validateLoginForm({ ...valid, password: 'x' }).password).toBeUndefined();
  });
});

describe('isLoginFormValid', () => {
  it('retourne true sur un objet vide', () => {
    expect(isLoginFormValid({})).toBe(true);
  });

  it('retourne false dès une clé', () => {
    expect(isLoginFormValid({ email: 'oups' })).toBe(false);
  });
});
