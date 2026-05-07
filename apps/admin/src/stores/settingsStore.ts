import { create } from 'zustand';
import { mockSettings, type Settings } from '../mocks/settings';

interface SettingsState {
  settings: Settings | null;
  loading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  updateSettings: (data: Partial<Settings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  loading: false,
  error: null,

  fetchSettings: async () => {
    set({ loading: true, error: null });
    await new Promise((r) => setTimeout(r, 300));
    set({ settings: mockSettings, loading: false });
  },

  updateSettings: async (data) => {
    set({ loading: true });
    await new Promise((r) => setTimeout(r, 300));
    set((state) => ({
      settings: state.settings ? { ...state.settings, ...data } : null,
      loading: false,
    }));
  },
}));
