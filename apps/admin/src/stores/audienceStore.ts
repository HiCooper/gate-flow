import { create } from 'zustand';
import { mockSegments, mockAttributes, type AudienceSegment, type Attribute, type BehaviorRule } from '../mocks/audience';

interface AudienceState {
  segments: AudienceSegment[];
  attributes: Attribute[];
  loading: boolean;
  error: string | null;
  fetchSegments: () => Promise<void>;
  fetchAttributes: () => Promise<void>;
  createSegment: (data: Pick<AudienceSegment, 'name' | 'description' | 'rules'>) => Promise<AudienceSegment>;
  updateSegment: (id: string, data: Partial<AudienceSegment>) => Promise<void>;
  deleteSegment: (id: string) => Promise<void>;
}

export const useAudienceStore = create<AudienceState>((set) => ({
  segments: [],
  attributes: [],
  loading: false,
  error: null,

  fetchSegments: async () => {
    set({ loading: true, error: null });
    await new Promise((r) => setTimeout(r, 300));
    set({ segments: mockSegments, loading: false });
  },

  fetchAttributes: async () => {
    set({ loading: true, error: null });
    await new Promise((r) => setTimeout(r, 200));
    set({ attributes: mockAttributes, loading: false });
  },

  createSegment: async (data) => {
    set({ loading: true });
    await new Promise((r) => setTimeout(r, 300));
    const newSegment: AudienceSegment = {
      id: `seg-${crypto.randomUUID().slice(0, 6)}`,
      name: data.name,
      description: data.description,
      rules: data.rules,
      estimatedSize: 0,
      activePaywalls: 0,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      segments: [newSegment, ...state.segments],
      loading: false,
    }));
    return newSegment;
  },

  updateSegment: async (id, data) => {
    set({ loading: true });
    await new Promise((r) => setTimeout(r, 300));
    set((state) => ({
      segments: state.segments.map((s) =>
        s.id === id ? { ...s, ...data } : s
      ),
      loading: false,
    }));
  },

  deleteSegment: async (id) => {
    await new Promise((r) => setTimeout(r, 200));
    set((state) => ({ segments: state.segments.filter((s) => s.id !== id) }));
  },
}));
