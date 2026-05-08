import type { 
  ExperimentReport, 
  ReportJob,
  ReportStatus,
  PaginatedResponse,
} from '../types';

const API_BASE = '/api/v1/reports';

// ============================================
// Report APIs
// ============================================

export interface GenerateReportRequest {
  experimentId: string;
  startDate: string;
  endDate: string;
  includeSecondaryMetrics?: boolean;
  includeGuardrails?: boolean;
  dimensions?: string[];
}

/**
 * 获取报告列表
 */
export async function listReports(params?: {
  experimentId?: string;
  status?: ReportStatus;
  startDate?: string;
  endDate?: string;
  current?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<ExperimentReport>> {
  const searchParams = new URLSearchParams();
  if (params?.experimentId) searchParams.set('experimentId', params.experimentId);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.startDate) searchParams.set('startDate', params.startDate);
  if (params?.endDate) searchParams.set('endDate', params.endDate);
  if (params?.current) searchParams.set('current', String(params.current));
  if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));

  const res = await fetch(`${API_BASE}/experiments?${searchParams}`);
  if (!res.ok) throw new Error('Failed to fetch reports');
  return res.json();
}

/**
 * 获取报告详情
 */
export async function getReport(reportId: string): Promise<ExperimentReport> {
  const res = await fetch(`${API_BASE}/experiments/${reportId}`);
  if (!res.ok) throw new Error('Failed to fetch report');
  return res.json();
}

/**
 * 触发生成报告
 */
export async function generateReport(
  request: GenerateReportRequest
): Promise<{ jobId: string; status: string }> {
  const res = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error('Failed to generate report');
  return res.json();
}

/**
 * 导出报告
 */
export async function exportReport(
  reportId: string,
  format: 'pdf' | 'excel' | 'csv' = 'pdf'
): Promise<Blob> {
  const res = await fetch(`${API_BASE}/experiments/${reportId}/export?format=${format}`);
  if (!res.ok) throw new Error('Failed to export report');
  return res.blob();
}

/**
 * 分享报告
 */
export async function shareReport(
  reportId: string,
  recipients: string[],
  message?: string
): Promise<{ shareUrl: string }> {
  const res = await fetch(`${API_BASE}/experiments/${reportId}/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipients, message }),
  });
  if (!res.ok) throw new Error('Failed to share report');
  return res.json();
}

// ============================================
// Job APIs
// ============================================

export interface ListJobsParams {
  type?: ReportJob['type'];
  status?: ReportJob['status'];
  experimentId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * 获取任务列表
 */
export async function getReportJobs(params?: ListJobsParams): Promise<ReportJob[]> {
  const searchParams = new URLSearchParams();
  if (params?.type) searchParams.set('type', params.type);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.experimentId) searchParams.set('experimentId', params.experimentId);
  if (params?.startDate) searchParams.set('startDate', params.startDate);
  if (params?.endDate) searchParams.set('endDate', params.endDate);

  const res = await fetch(`${API_BASE}/jobs?${searchParams}`);
  if (!res.ok) throw new Error('Failed to fetch jobs');
  return res.json();
}

/**
 * 获取任务详情
 */
export async function getJobStatus(jobId: string): Promise<ReportJob> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}`);
  if (!res.ok) throw new Error('Failed to fetch job status');
  return res.json();
}

/**
 * 取消任务
 */
export async function cancelJob(jobId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}/cancel`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to cancel job');
}

/**
 * 重试失败任务
 */
export async function retryJob(jobId: string): Promise<{ jobId: string }> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}/retry`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to retry job');
  return res.json();
}

/**
 * 获取所有报告列表（简化版）
 */
export async function getAllReports(): Promise<ExperimentReport[]> {
  const res = await fetch(`${API_BASE}/experiments`);
  if (!res.ok) throw new Error('Failed to fetch reports');
  return res.json();
}

/**
 * 获取待处理报告数量
 */
export async function getPendingReportsCount(): Promise<number> {
  const res = await fetch(`${API_BASE}/experiments/pending-count`);
  if (!res.ok) throw new Error('Failed to fetch pending count');
  return res.json();
}
