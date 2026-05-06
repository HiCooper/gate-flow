const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api/v1';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export interface Experiment {
  id: number;
  expId: string;
  name: string;
  description: string;
  layerId: number;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'ramp';
  bucketStart: number;
  bucketEnd: number;
  createdAt: string;
  updatedAt: string;
}

export interface Variant {
  id: number;
  expId: number;
  version: string;
  variantKey: string;
  name: string;
  bucketStart: number;
  bucketEnd: number;
  params: string;
  isActive: boolean;
  createdAt: string;
}

export interface VersionComparison {
  version1: string;
  version2: string;
  variants1: Variant[];
  variants2: Variant[];
  hasDifferences: boolean;
  variantCount1: number;
  variantCount2: number;
}

export const experimentApi = {
  // 实验列表
  list: (current = 1, size = 10, layerId?: number, status?: string) => {
    const params = new URLSearchParams({
      current: current.toString(),
      size: size.toString(),
    });
    if (layerId) params.append('layerId', layerId.toString());
    if (status) params.append('status', status);
    return request<Experiment[]>(`/experiments?${params}`);
  },

  // 实验详情
  getById: (id: number) => request<Experiment>(`/experiments/${id}`),

  // 创建实验
  create: (data: {
    name: string;
    description?: string;
    layerId: number;
    bucketStart: number;
    bucketEnd: number;
    variants: Array<{
      variantKey: string;
      name: string;
      bucketStart: number;
      bucketEnd: number;
      params?: string;
    }>;
  }) => request<Experiment>('/experiments', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // 更新实验（创建新版本）
  update: (id: number, data: {
    name?: string;
    description?: string;
    bucketStart?: number;
    bucketEnd?: number;
    variants?: Array<{
      variantKey: string;
      name: string;
      trafficPercentage: number;  // 必填：前端传流量比例，后端计算bucket边界
      params?: string;
    }>;
  }) => request<Experiment>(`/experiments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // 启动实验
  start: (id: number) => request<Experiment>(`/experiments/${id}/start`, {
    method: 'POST',
  }),

  // 停止实验
  stop: (id: number) => request<Experiment>(`/experiments/${id}/stop`, {
    method: 'POST',
  }),

  // 获取版本历史
  getVersions: (expId: number) => request<string[]>(`/experiments/${expId}/versions`),

  // 获取活跃版本
  getActiveVersion: (expId: number) => request<Variant[]>(`/experiments/${expId}/versions/active`),

  // 获取指定版本
  getVersion: (expId: number, version: string) => 
    request<Variant[]>(`/experiments/${expId}/versions/${version}`),

  // 回滚版本
  rollback: (expId: number, version: string) => 
    request<{ success: boolean; message: string; version: string; variantCount: number }>(
      `/experiments/${expId}/versions/rollback/${version}`,
      { method: 'POST' }
    ),

  // 版本对比
  compareVersions: (expId: number, v1: string, v2: string) =>
    request<VersionComparison>(
      `/experiments/${expId}/versions/compare?v1=${v1}&v2=${v2}`
    ),
};
