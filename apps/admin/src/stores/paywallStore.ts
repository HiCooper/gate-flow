import { create } from 'zustand';
import { mockPaywalls, type Paywall, type PaywallStatus } from '../mocks/paywalls';

interface PaywallState {
  paywalls: Paywall[];
  loading: boolean;
  error: string | null;
  fetchPaywalls: () => Promise<void>;
  createPaywall: (data: Pick<Paywall, 'name' | 'description' | 'platform' | 'template'>) => Promise<Paywall>;
  updatePaywall: (id: string, data: Partial<Paywall>) => Promise<void>;
  deletePaywall: (id: string) => Promise<void>;
}

export const usePaywallStore = create<PaywallState>((set) => ({
  paywalls: [],
  loading: false,
  error: null,

  fetchPaywalls: async () => {
    set({ loading: true, error: null });
    await new Promise((r) => setTimeout(r, 300));
    set({ paywalls: mockPaywalls, loading: false });
  },

  createPaywall: async (data) => {
    set({ loading: true });
    await new Promise((r) => setTimeout(r, 300));
    const newPaywall: Paywall = {
      id: `pw-${crypto.randomUUID().slice(0, 6)}`,
      name: data.name,
      description: data.description,
      status: 'draft' as PaywallStatus,
      template: data.template,
      platform: data.platform,
      conversions: 0,
      impressions: 0,
      revenue: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      layers: [],
    };
    set((state) => ({
      paywalls: [newPaywall, ...state.paywalls],
      loading: false,
    }));
    return newPaywall;
  },

  updatePaywall: async (id, data) => {
    set({ loading: true });
    await new Promise((r) => setTimeout(r, 300));
    set((state) => ({
      paywalls: state.paywalls.map((p) =>
        p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
      ),
      loading: false,
    }));
  },

  deletePaywall: async (id) => {
    await new Promise((r) => setTimeout(r, 200));
    set((state) => ({ paywalls: state.paywalls.filter((p) => p.id !== id) }));
  },
}));
