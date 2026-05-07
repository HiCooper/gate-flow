import { create } from 'zustand';
import { mockAnalytics, type AnalyticsData } from '../mocks/analytics';

interface AnalyticsState {
  data: AnalyticsData | null;
  loading: boolean;
  error: string | null;
  fetchAnalytics: () => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  data: null,
  loading: false,
  error: null,

  fetchAnalytics: async () => {
    set({ loading: true, error: null });
    await new Promise((r) => setTimeout(r, 400));
    set({ data: mockAnalytics, loading: false });
  },
}));
