import type { 
  Experiment, 
  ExperimentStatus, 
  PaginatedResponse,
  ExperimentSummary 
} from '../types';

const API_BASE = '/api/v1';

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
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

  const res = await fetch(`${API_BASE}/experiments?${searchParams}`);
  if (!res.ok) throw new Error('Failed to fetch experiments');
  
  const data = await res.json();
  // Handle both array and paginated response
  if (Array.isArray(data)) {
    return {
      data,
      total: data.length,
      current: 1,
      pageSize: data.length,
      totalPages: 1,
    };
  }
  return data;
}

/**
 * 获取实验摘要列表（用于概览页）
 */
export async function listExperimentSummaries(
  params: ListExperimentsParams = {}
): Promise<ExperimentSummary[]> {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set('status', params.status);
  if (params.search) searchParams.set('search', params.search);

  const res = await fetch(`${API_BASE}/experiments/summary?${searchParams}`);
  if (!res.ok) throw new Error('Failed to fetch experiment summaries');
  return res.json();
}

/**
 * 获取实验详情
 */
export async function getExperiment(id: string): Promise<Experiment> {
  const res = await fetch(`${API_BASE}/experiments/${id}`);
  if (!res.ok) throw new Error('Failed to fetch experiment');
  return res.json();
}

/**
 * 获取实验变体列表
 */
export async function getExperimentVariants(id: string): Promise<Experiment['variants']> {
  const res = await fetch(`${API_BASE}/experiments/${id}/variants`);
  if (!res.ok) throw new Error('Failed to fetch variants');
  return res.json();
}

/**
 * 获取实验版本历史
 */
export async function getExperimentVersions(id: string): Promise<unknown[]> {
  const res = await fetch(`${API_BASE}/experiments/${id}/versions`);
  if (!res.ok) throw new Error('Failed to fetch versions');
  return res.json();
}

/**
 * 获取运行中的实验列表
 */
export async function getRunningExperiments(): Promise<Experiment[]> {
  const res = await fetch(`${API_BASE}/experiments?status=running`);
  if (!res.ok) throw new Error('Failed to fetch running experiments');
  
  const data = await res.json();
  return Array.isArray(data) ? data : data.data || [];
}

/**
 * 获取我负责的实验
 */
export async function getMyExperiments(): Promise<Experiment[]> {
  const res = await fetch(`${API_BASE}/experiments/my`);
  if (!res.ok) throw new Error('Failed to fetch my experiments');
  
  const data = await res.json();
  return Array.isArray(data) ? data : data.data || [];
}

/**
 * 获取实验统计概览
 */
export async function getExperimentOverview(): Promise<{
  total: number;
  byStatus: Record<ExperimentStatus, number>;
  recentActivity: { date: string; count: number }[];
}> {
  const res = await fetch(`${API_BASE}/experiments/overview`);
  if (!res.ok) throw new Error('Failed to fetch experiment overview');
  return res.json();
}
