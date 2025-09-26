import apiClient from './api';

export interface AuditLog {
  id: string;
  entity: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'UPLOAD' | 'DOWNLOAD' | 'EXPORT' | 'IMPORT';
  actor: {
    id: string;
    name: string;
    email: string;
  };
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AuditSummary {
  totalLogs: number;
  actionsCount: Record<string, number>;
  recentLogs: AuditLog[];
}

export interface AuditFilters {
  entity?: string;
  entityId?: string;
  action?: string;
  actorId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

class AuditService {
  async getLogsByEntity(entity: string, entityId: string): Promise<AuditLog[]> {
    const response = await apiClient.get(`/audit/logs/entity?entity=${entity}&entityId=${entityId}`);
    return response.data;
  }

  async getLogsByActor(actorId: string, limit?: number): Promise<AuditLog[]> {
    const params = limit ? `?limit=${limit}` : '';
    const response = await apiClient.get(`/audit/logs/actor/${actorId}${params}`);
    return response.data;
  }

  async getLogsByAction(action: string, limit?: number): Promise<AuditLog[]> {
    const params = limit ? `?limit=${limit}` : '';
    const response = await apiClient.get(`/audit/logs/action/${action}${params}`);
    return response.data;
  }

  async getLogsByDateRange(startDate: string, endDate: string, limit?: number): Promise<AuditLog[]> {
    const params = new URLSearchParams();
    params.append('startDate', startDate);
    params.append('endDate', endDate);
    if (limit) params.append('limit', limit.toString());

    const response = await apiClient.get(`/audit/logs/date-range?${params.toString()}`);
    return response.data;
  }

  async getAuditSummary(entity?: string, entityId?: string): Promise<AuditSummary> {
    const params = new URLSearchParams();
    if (entity) params.append('entity', entity);
    if (entityId) params.append('entityId', entityId);

    const response = await apiClient.get(`/audit/summary?${params.toString()}`);
    return response.data;
  }

  async exportLogs(filters: AuditFilters): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters.entity) params.append('entity', filters.entity);
    if (filters.entityId) params.append('entityId', filters.entityId);
    if (filters.action) params.append('action', filters.action);
    if (filters.actorId) params.append('actorId', filters.actorId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`/audit/export?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  }
}

export const auditService = new AuditService();
