import { create } from 'zustand';
import { authService } from '@/services/authService';
import { isRegisterError } from '@/types/auth';
import type { RegisterError, RegisterPayload } from '@/types/auth';

export type AuthStatus = 'idle' | 'pending' | 'success' | 'error';

type AuthState = {
  status: AuthStatus;
  error: RegisterError | null;
  register: (payload: RegisterPayload) => Promise<void>;
  reset: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  status: 'idle',
  error: null,

  async register(payload) {
    set({ status: 'pending', error: null });
    try {
      await authService.register(payload);
      set({ status: 'success', error: null });
    } catch (err) {
      const error: RegisterError = isRegisterError(err)
        ? err
        : { kind: 'network', message: 'Une erreur inattendue est survenue.' };
      set({ status: 'error', error });
    }
  },

  reset() {
    set({ status: 'idle', error: null });
  },
}));
