import { create } from 'zustand';
import { experimentApi, type Experiment as ApiExperiment, type Variant as ApiVariant } from '../api/experimentApi';
import type { ExperimentUI, VariantUI, ExperimentStatus } from '../components/experiments/types';

// 将后端 API Variant 映射到前端 UI Variant
function mapApiToVariantUI(apiVariant: ApiVariant): VariantUI {
  return {
    id: apiVariant.id.toString(),
    name: apiVariant.name || apiVariant.variantKey,
    config: apiVariant.params ? JSON.parse(apiVariant.params) : {},
    conversionRate: 0,
    impressions: 0,
    conversions: 0,
    // 后端使用0-9999表示0%-100%，需要除以10000
    trafficPercentage: Math.round(((apiVariant.bucketEnd - apiVariant.bucketStart + 1) / 10000) * 100),
    isControl: apiVariant.variantKey === 'control',
  };
}

// 将后端 API 数据映射到前端 UI 数据格式
function mapApiToExperimentUI(apiExp: ApiExperiment, variants: VariantUI[] = []): ExperimentUI {
  return {
    id: apiExp.id.toString(),
    name: apiExp.name,
    paywallId: apiExp.expId,
    paywallName: apiExp.name, // TODO: 应该从paywall表获取真实名称
    status: apiExp.status as ExperimentStatus,
    hypothesis: apiExp.description || '待补充假设',
    primaryMetric: 'conversion_rate', // TODO: 后端API缺少此字段
    targetingRules: [],
    startDate: apiExp.createdAt, // TODO: 后端API缺少startTime字段
    variants: variants,
    trafficAllocation: apiExp.bucketEnd !== null && apiExp.bucketStart !== null 
      ? Math.round(((apiExp.bucketEnd - apiExp.bucketStart + 1) / 100) * 100)
      : 100, // 默认100%
    results: { confidence: 0, totalImpressions: 0, totalConversions: 0 },
    createdAt: apiExp.createdAt,
  };
}

interface CreateExperimentInput {
  name: string;
  hypothesis: string;
  paywallId: string;
  paywallName: string;
  primaryMetric: string;
  trafficAllocation?: number;
}

interface ExperimentState {
  experiments: ExperimentUI[];
  selectedExperiment: ExperimentUI | null;
  selectedVariants: VariantUI[];
  loading: boolean;
  error: string | null;
  fetchExperiments: () => Promise<void>;
  fetchExperimentDetail: (id: string) => Promise<void>;
  createExperiment: (data: CreateExperimentInput) => Promise<ExperimentUI>;
  updateExperiment: (id: string, data: Partial<ExperimentUI>) => Promise<void>;
  updateExperimentStatus: (id: string, status: ExperimentStatus) => Promise<void>;
  deleteExperiment: (id: string) => Promise<void>;
}

export const useExperimentStore = create<ExperimentState>((set, get) => ({
  experiments: [],
  selectedExperiment: null,
  selectedVariants: [],
  loading: false,
  error: null,

  fetchExperiments: async () => {
    set({ loading: true, error: null });
    try {
      const apiExperiments = await experimentApi.list(1, 100);
      // 列表页不需要variants，传空数组
      const experiments = apiExperiments.map((apiExp) => mapApiToExperimentUI(apiExp, []));
      set({ experiments, loading: false });
    } catch (error) {
      console.error('Failed to fetch experiments:', error);
      set({ experiments: [], loading: false, 
            error: 'API 连接失败，请检查后端服务' });
    }
  },

  fetchExperimentDetail: async (id) => {
    set({ loading: true, error: null });
    try {
      const apiId = parseInt(id, 10);
      const [apiExperiment, apiVariants] = await Promise.all([
        experimentApi.getById(apiId),
        experimentApi.getActiveVersion(apiId),
      ]);
      
      const experiment = mapApiToExperimentUI(apiExperiment);
      const variants = apiVariants.map(mapApiToVariantUI);
      
      set({ 
        selectedExperiment: experiment, 
        selectedVariants: variants,
        loading: false 
      });
    } catch (error) {
      console.error('Failed to fetch experiment detail:', error);
      set({ loading: false, error: '获取实验详情失败' });
    }
  },

  createExperiment: async (data) => {
    set({ loading: true, error: null });
    try {
      const trafficAllocation = data.trafficAllocation ?? 50;
      const bucketEnd = trafficAllocation - 1;
      const midPoint = Math.floor(trafficAllocation / 2);
      
      const apiExperiment = await experimentApi.create({
        name: data.name,
        description: data.hypothesis,
        layerId: 1,
        bucketStart: 0,
        bucketEnd: bucketEnd,
        variants: [
          {
            variantKey: 'control',
            name: '对照组',
            bucketStart: 0,
            bucketEnd: midPoint - 1,
            params: '{}',
          },
          {
            variantKey: 'treatment',
            name: '实验组',
            bucketStart: midPoint,
            bucketEnd: bucketEnd,
            params: '{}',
          },
        ],
      });
      const newExperiment = mapApiToExperimentUI(apiExperiment);
      set((state) => ({
        experiments: [newExperiment, ...state.experiments],
        loading: false,
      }));
      return newExperiment;
    } catch (error) {
      console.error('Failed to create experiment:', error);
      const errorMessage = error instanceof Error ? error.message : '创建实验失败';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  updateExperiment: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const apiId = parseInt(id, 10);
      await experimentApi.update(apiId, {
        name: data.name,
        description: data.hypothesis,
      });
      set((state) => ({
        experiments: state.experiments.map((e) =>
          e.id === id ? { ...e, ...data } : e
        ),
        loading: false,
      }));
    } catch (error) {
      console.error('Failed to update experiment:', error);
      set({ loading: false, error: '更新实验失败' });
      throw error;
    }
  },

  updateExperimentStatus: async (id, status) => {
    set({ loading: true, error: null });
    try {
      const apiId = parseInt(id, 10);
      if (status === 'running') {
        await experimentApi.start(apiId);
      } else if (status === 'paused') {
        await experimentApi.stop(apiId);
      }
      set((state) => ({
        experiments: state.experiments.map((e) =>
          e.id === id ? { ...e, status } : e
        ),
        loading: false,
      }));
    } catch (error) {
      console.error('Failed to update experiment status:', error);
      set({ loading: false, error: '更新状态失败' });
      throw error;
    }
  },

  deleteExperiment: async (id) => {
    set({ loading: true, error: null });
    try {
      // TODO: 后端暂不支持删除 API
      set((state) => ({
        experiments: state.experiments.filter((e) => e.id !== id),
        loading: false,
      }));
    } catch (error) {
      console.error('Failed to delete experiment:', error);
      set({ loading: false, error: '删除实验失败' });
      throw error;
    }
  },
}));