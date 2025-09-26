import apiClient from './api';

export interface JwnetJob {
  id: string;
  caseId: string;
  jobType: '登録' | '更新' | '受渡確認' | '完了報告';
  payload: Record<string, any>;
  status: '待機中' | '処理中' | '完了' | 'エラー' | 'リトライ';
  externalId?: string;
  externalResponse?: Record<string, any>;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: string;
  nextRetryAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJwnetJobRequest {
  caseId: string;
  jobType: '登録' | '更新' | '受渡確認' | '完了報告';
  payload: Record<string, any>;
}

export interface JwnetJobStatus {
  status: '待機中' | '処理中' | '完了' | 'エラー' | 'リトライ';
  attempts: number;
  lastAttemptAt?: string;
  nextRetryAt?: string;
  errorMessage?: string;
}

export interface ManifestPayload {
  manifestId: string;
  wasteGenerator: {
    name: string;
    company: string;
    address: string;
    phone: string;
    email: string;
  };
  carrier?: {
    name: string;
    companyCode: string;
    permits: any[];
  };
  wasteInfo: {
    type: string;
    category: string;
    estimatedVolume?: number;
    estimatedWeight?: number;
  };
  collectionInfo: {
    siteAddress: string;
    siteLat: number;
    siteLng: number;
    scheduledDate: string;
    specialRequirements?: string;
  };
  status: string;
  createdAt: string;
}

class JwnetService {
  async createJob(jobData: CreateJwnetJobRequest): Promise<JwnetJob> {
    const response = await apiClient.post('/jwnet/jobs', jobData);
    return response.data;
  }

  async getJobs(): Promise<JwnetJob[]> {
    const response = await apiClient.get('/jwnet/jobs');
    return response.data;
  }

  async getJobsByCase(caseId: string): Promise<JwnetJob[]> {
    const response = await apiClient.get(`/jwnet/jobs/case/${caseId}`);
    return response.data;
  }

  async getJob(id: string): Promise<JwnetJob> {
    const response = await apiClient.get(`/jwnet/jobs/${id}`);
    return response.data;
  }

  async retryJob(id: string): Promise<JwnetJob> {
    const response = await apiClient.post(`/jwnet/jobs/${id}/retry`);
    return response.data;
  }

  async getJobStatus(id: string): Promise<JwnetJobStatus> {
    const response = await apiClient.get(`/jwnet/jobs/${id}/status`);
    return response.data;
  }

  async generateManifestPayload(caseId: string): Promise<ManifestPayload> {
    const response = await apiClient.get(`/jwnet/manifest/${caseId}`);
    return response.data;
  }

  async processPendingJobs(): Promise<{ message: string; processedCount: number }> {
    const response = await apiClient.post('/jwnet/process-pending');
    return response.data;
  }
}

export const jwnetService = new JwnetService();
