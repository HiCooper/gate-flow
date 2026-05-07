import { create } from 'zustand';
import { mockTemplates, type Template } from '../mocks/templates';

interface TemplateState {
  templates: Template[];
  loading: boolean;
  error: string | null;
  fetchTemplates: () => Promise<void>;
}

export const useTemplateStore = create<TemplateState>((set) => ({
  templates: [],
  loading: false,
  error: null,

  fetchTemplates: async () => {
    set({ loading: true, error: null });
    await new Promise((r) => setTimeout(r, 300));
    set({ templates: mockTemplates, loading: false });
  },
}));
