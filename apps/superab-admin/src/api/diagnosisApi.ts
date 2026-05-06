const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api/v1';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }

  return response.json();
}

export interface SrmResult {
  pValue: number;
  isSignificant: boolean;
  observed: number[];
  expected: number[];
}

export interface AaResult {
  totalTests: number;
  falsePositives: number;
  falsePositiveRate: number;
  isAcceptable: boolean;
  recommendation: string;
}

export interface TrafficData {
  variantKey: string;
  expected: number;
  actual: number;
  impressions: number;
}

export const diagnosisApi = {
  /**
   * Test Sample Ratio Mismatch
   */
  testSRM: (expId: number) => 
    request<SrmResult>(`/experiments/${expId}/diagnosis/srm`),
  
  /**
   * A/A Validation
   */
  validateAA: (expId: number) => 
    request<AaResult>(`/experiments/${expId}/diagnosis/aa`),
  
  /**
   * Get real-time traffic data
   */
  getTrafficData: (expId: number) => 
    request<TrafficData[]>(`/experiments/${expId}/diagnosis/traffic`),
};
