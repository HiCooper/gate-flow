import type {
  Experiment,
  ExperimentStatus,
  PaginatedResponse,
  Variant,
} from '../types';

const API_BASE = '/api/v1';

// Backend API response types (from victor-web)
interface BackendExperiment {
  id: number;
  expId: string;
  name: string;
  description: string;
  layerId: number;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'ramp' | 'review' | 'analyzing' | 'decision' | 'archive';
  bucketStart: number;
  bucketEnd: number;
  createdAt: string;
  updatedAt: string;
}

interface BackendVariant {
  id: number;
  expId: number;
  version: string;
  bucketId: string;
  variantKey: string;
  name: string;
  bucketStart: number;
  bucketEnd: number;
  params: string;
  isActive: boolean;
  createdAt: string;
}

// Map backend experiment to ds-platform Experiment type
function mapBackendExperiment(exp: BackendExperiment, variants: BackendVariant[] = []): Experiment {
  return {
    id: exp.expId,  // Use expId as the display ID
    expKey: exp.expId,
    name: exp.name,
    description: exp.description || '',
    status: mapStatus(exp.status),
    layerId: exp.layerId,
    bucketStart: exp.bucketStart,
    bucketEnd: exp.bucketEnd,
    startTime: exp.createdAt,
    endTime: undefined,
    createdBy: 'unknown',
    tags: [],
    variants: variants.map(mapBackendVariant),
    primaryMetric: 'conversion_rate',
  };
}

function mapBackendVariant(v: BackendVariant): Variant {
  const trafficPercent = Math.round(((v.bucketEnd - v.bucketStart + 1) / 10000) * 100);
  return {
    id: v.variantKey,
    variantKey: v.variantKey,
    name: v.name,
    description: undefined,
    bucketStart: v.bucketStart,
    bucketEnd: v.bucketEnd,
    isControl: v.bucketStart === 0,
    trafficPercent,
    params: v.params ? JSON.parse(v.params) : undefined,
    metrics: undefined,
  };
}

function mapStatus(s: string): ExperimentStatus {
  const statusMap: Record<string, ExperimentStatus> = {
    draft: 'draft',
    running: 'running',
    paused: 'paused',
    completed: 'completed',
    archived: 'archived',
    ramp: 'running',
    review: 'draft',
    analyzing: 'completed',
    decision: 'completed',
  };
  return statusMap[s] || 'draft';
}

export interface ListExperimentsParams {
  status?: ExperimentStatus;
  layerId?: number;
  search?: string;
  current?: number;
  pageSize?: number;
  sortBy?: 'startTime' | 'name' | 'status';
  sortOrder?: 'asc' | 'desc';
}

/**
 * 获取实验列表
 */
export async function listExperiments(
  params: ListExperimentsParams = {}
): Promise<PaginatedResponse<Experiment>> {
  const searchParams = new URLSearchParams();

  if (params.status) searchParams.set('status', params.status);
  if (params.layerId) searchParams.set('layerId', String(params.layerId));
  if (params.search) searchParams.set('search', params.search);
  if (params.current) searchParams.set('current', String(params.current));
  if (params.pageSize) searchParams.set('size', String(params.pageSize || 100));

  const res = await fetch(`${API_BASE}/experiments?${searchParams}`);
  if (!res.ok) throw new Error('Failed to fetch experiments');

  const data = await res.json();
  const experiments: Experiment[] = Array.isArray(data) ? data.map((exp: BackendExperiment) => mapBackendExperiment(exp)) : [];
  return {
    data: experiments,
    total: experiments.length,
    current: 1,
    pageSize: experiments.length,
    totalPages: 1,
  };
}

/**
 * 获取实验详情
 */
export async function getExperiment(id: string): Promise<Experiment> {
  // First get the list to find the numeric ID
  const listRes = await fetch(`${API_BASE}/experiments?size=100`);
  if (!listRes.ok) throw new Error('Failed to fetch experiments');
  const listData = await listRes.json();
  const experiments: BackendExperiment[] = Array.isArray(listData) ? listData : listData.data || [];

  // Find experiment by expId
  const backendExp = experiments.find(exp => exp.expId === id || String(exp.id) === id);
  if (!backendExp) throw new Error('Experiment not found');

  // Fetch variants
  let variants: BackendVariant[] = [];
  try {
    const variantsRes = await fetch(`${API_BASE}/experiments/${backendExp.id}/versions/active`);
    if (variantsRes.ok) {
      variants = await variantsRes.json();
    }
  } catch (e) {
    // Ignore variants fetch error
  }

  return mapBackendExperiment(backendExp, variants);
}

/**
 * 获取实验变体列表
 */
export async function getExperimentVariants(expId: string): Promise<Variant[]> {
  // First get the list to find the numeric ID
  const listRes = await fetch(`${API_BASE}/experiments?size=100`);
  if (!listRes.ok) throw new Error('Failed to fetch experiments');
  const listData = await listRes.json();
  const experiments: BackendExperiment[] = Array.isArray(listData) ? listData : listData.data || [];

  const backendExp = experiments.find(exp => exp.expId === expId);
  if (!backendExp) throw new Error('Experiment not found');

  const res = await fetch(`${API_BASE}/experiments/${backendExp.id}/versions/active`);
  if (!res.ok) throw new Error('Failed to fetch variants');
  const data: BackendVariant[] = await res.json();
  return data.map(mapBackendVariant);
}
