import apiClient from './api';

export interface GpsEvent {
  id: string;
  caseId: string;
  deviceId: string;
  lat: number;
  lng: number;
  accuracyM: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  timestamp: string;
  eventType: '現場到着' | '積込開始' | '積込完了' | '処分場到着' | '処分完了' | 'その他';
  status: 'OK' | 'NG' | '要確認';
  thresholdDistanceM?: number;
  distanceFromSiteM?: number;
  createdAt: string;
}

export interface CreateGpsEventRequest {
  caseId: string;
  deviceId: string;
  lat: number;
  lng: number;
  accuracyM: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  eventType: '現場到着' | '積込開始' | '積込完了' | '処分場到着' | '処分完了' | 'その他';
  thresholdDistanceM?: number;
}

export interface GpsEventSummary {
  totalEvents: number;
  okEvents: number;
  ngEvents: number;
  lastEvent?: GpsEvent;
  averageAccuracy: number;
}

export interface LocationValidation {
  isValid: boolean;
  distance: number;
  status: 'OK' | 'NG' | '要確認';
}

class GpsService {
  async createEvent(eventData: CreateGpsEventRequest): Promise<GpsEvent> {
    const response = await apiClient.post('/gps/events', eventData);
    return response.data;
  }

  async getEventsByCase(caseId: string): Promise<GpsEvent[]> {
    const response = await apiClient.get(`/gps/events/case/${caseId}`);
    return response.data;
  }

  async getEventsByDevice(deviceId: string, limit?: number): Promise<GpsEvent[]> {
    const params = limit ? `?limit=${limit}` : '';
    const response = await apiClient.get(`/gps/events/device/${deviceId}${params}`);
    return response.data;
  }

  async getEventSummary(caseId: string): Promise<GpsEventSummary> {
    const response = await apiClient.get(`/gps/summary/case/${caseId}`);
    return response.data;
  }

  async validateLocation(
    lat: number,
    lng: number,
    caseLat: number,
    caseLng: number,
    thresholdDistance?: number
  ): Promise<LocationValidation> {
    const response = await apiClient.post('/gps/validate', {
      lat,
      lng,
      caseLat,
      caseLng,
      thresholdDistance,
    });
    return response.data;
  }
}

export const gpsService = new GpsService();
