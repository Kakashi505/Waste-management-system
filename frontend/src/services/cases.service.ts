import apiClient from './api';

export interface Case {
  id: string;
  caseNumber: string;
  siteLat: number;
  siteLng: number;
  siteAddress: string;
  wasteType: string;
  wasteCategory: string;
  estimatedVolume?: number;
  estimatedWeight?: number;
  scheduledDate: string;
  status: '新規' | 'マッチング中' | '業者選定済み' | '収集完了' | '処分完了' | 'キャンセル';
  priority: '緊急' | '高' | '通常' | '低';
  specialRequirements?: string;
  createdBy: {
    id: string;
    name: string;
    companyName: string;
  };
  assignedCarrier?: {
    id: string;
    name: string;
    companyCode: string;
  };
  bids?: Bid[];
  photos?: Photo[];
  gpsEvents?: GpsEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface Bid {
  id: string;
  carrier: {
    id: string;
    name: string;
    companyCode: string;
  };
  amount: number;
  message?: string;
  status: '提出済み' | '受注' | '落札' | 'キャンセル';
  createdAt: string;
}

export interface Photo {
  id: string;
  fileName: string;
  s3Key: string;
  tag: '排出現場' | '積込' | '処分場' | 'その他';
  status: 'アップロード済み' | '検証済み' | 'フラグ付き' | 'エラー';
  validationResult?: {
    isValid: boolean;
    distanceFromSite: number;
    accuracyThreshold: number;
    exifValid: boolean;
    gpsValid: boolean;
    timestampValid: boolean;
    errors: string[];
  };
  createdAt: string;
}

export interface GpsEvent {
  id: string;
  deviceId: string;
  lat: number;
  lng: number;
  accuracyM: number;
  eventType: '現場到着' | '積込開始' | '積込完了' | '処分場到着' | '処分完了' | 'その他';
  status: 'OK' | 'NG' | '要確認';
  timestamp: string;
}

export interface CreateCaseRequest {
  siteLat: number;
  siteLng: number;
  siteAddress: string;
  wasteType: string;
  wasteCategory: string;
  estimatedVolume?: number;
  estimatedWeight?: number;
  scheduledDate: string;
  priority?: '緊急' | '高' | '通常' | '低';
  specialRequirements?: string;
  autoAssign?: boolean;
  auctionEnabled?: boolean;
  auctionStartAt?: string;
  auctionEndAt?: string;
}

export interface CaseFilters {
  status?: string;
  priority?: string;
  wasteType?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface MatchingResult {
  carrier: {
    id: string;
    name: string;
    companyCode: string;
  };
  score: number;
  reasons: string[];
}

class CasesService {
  async getCases(filters?: CaseFilters): Promise<Case[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.wasteType) params.append('wasteType', filters.wasteType);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);

    const response = await apiClient.get(`/cases?${params.toString()}`);
    return response.data;
  }

  async getCase(id: string): Promise<Case> {
    const response = await apiClient.get(`/cases/${id}`);
    return response.data;
  }

  async createCase(caseData: CreateCaseRequest): Promise<Case> {
    const response = await apiClient.post('/cases', caseData);
    return response.data;
  }

  async updateCase(id: string, caseData: Partial<CreateCaseRequest>): Promise<Case> {
    const response = await apiClient.patch(`/cases/${id}`, caseData);
    return response.data;
  }

  async updateCaseStatus(id: string, status: string, reason?: string): Promise<Case> {
    const response = await apiClient.patch(`/cases/${id}/status`, { status, reason });
    return response.data;
  }

  async assignCarrier(id: string, carrierId: string): Promise<Case> {
    const response = await apiClient.patch(`/cases/${id}/assign`, { carrierId });
    return response.data;
  }

  async cancelCase(id: string, reason?: string): Promise<Case> {
    const response = await apiClient.patch(`/cases/${id}/cancel`, { reason });
    return response.data;
  }

  async getMatchingResults(id: string): Promise<MatchingResult[]> {
    const response = await apiClient.get(`/cases/${id}/matching`);
    return response.data;
  }
}

export const casesService = new CasesService();
