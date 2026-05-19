// apps/web/lib/store.ts
import { create } from 'zustand';
import { AppUser, Tenant } from '@repo/types';

interface AuthState {
  user: AppUser | null;
  tenant: Tenant | null;
  isLoading: boolean;
  setUser: (user: AppUser | null) => void;
  setTenant: (tenant: Tenant | null) => void;
  setLoading: (status: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tenant: null,
  isLoading: true,
  
  setUser: (user) => set({ user }),
  setTenant: (tenant) => set({ tenant }),
  setLoading: (status) => set({ isLoading: status }),
  
  logout: () => set({ user: null, tenant: null, isLoading: false }),
}));