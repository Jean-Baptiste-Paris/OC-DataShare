import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '@/services/authService';
import { isLoginError, isRegisterError } from '@/types/auth';
import type {
  LoginError,
  LoginPayload,
  RegisterError,
  RegisterPayload,
  User,
} from '@/types/auth';

export type RegisterStatus = 'idle' | 'pending' | 'success' | 'error';
export type LoginStatus = 'idle' | 'pending' | 'error';

type AuthState = {
  token: string | null;
  user: User | null;

  registerStatus: RegisterStatus;
  registerError: RegisterError | null;

  loginStatus: LoginStatus;
  loginError: LoginError | null;

  register: (payload: RegisterPayload) => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  bootstrap: () => Promise<void>;
  logout: () => void;
  resetRegister: () => void;
  resetLogin: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      registerStatus: 'idle',
      registerError: null,
      loginStatus: 'idle',
      loginError: null,

      async register(payload) {
        set({ registerStatus: 'pending', registerError: null });
        try {
          await authService.register(payload);
          set({ registerStatus: 'success' });
        } catch (err) {
          const error: RegisterError = isRegisterError(err)
            ? err
            : { kind: 'network', message: 'Une erreur inattendue est survenue.' };
          set({ registerStatus: 'error', registerError: error });
        }
      },

      async login(payload) {
        set({ loginStatus: 'pending', loginError: null });
        try {
          const token = await authService.login(payload);
          set({ token });
          const user = await authService.me();
          set({ user, loginStatus: 'idle' });
        } catch (err) {
          const error: LoginError = isLoginError(err)
            ? err
            : { kind: 'network', message: 'Une erreur inattendue est survenue.' };
          set({ token: null, user: null, loginStatus: 'error', loginError: error });
        }
      },

      async bootstrap() {
        if (!get().token) return;
        try {
          const user = await authService.me();
          set({ user });
        } catch {
          set({ token: null, user: null });
        }
      },

      logout() {
        set({ token: null, user: null });
      },

      resetRegister() {
        set({ registerStatus: 'idle', registerError: null });
      },

      resetLogin() {
        set({ loginStatus: 'idle', loginError: null });
      },
    }),
    {
      name: 'datashare-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
);
