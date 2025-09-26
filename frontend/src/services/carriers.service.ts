import apiClient from './api';

export interface Carrier {
  id: string;
  name: string;
  companyCode: string;
  permits: {
    permitNumber: string;
    permitType: string;
    validFrom: string;
    validTo: string;
    wasteTypes: string[];
  }[];
  serviceAreas: {
    type: 'polygon' | 'radius';
    coordinates: number[][];
    center?: {
      lat: number;
      lng: number;
    };
    radius?: number;
  }[];
  priceMatrix: {
    wasteType: string;
    basePrice: number;
    pricePerUnit: number;
    unit: 'kg' | 'm3' | 'truck';
    minimumCharge: number;
    additionalFees?: {
      name: string;
      amount: number;
    }[];
  }[];
  reliabilityScore: number;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCarrierRequest {
  name: string;
  companyCode: string;
  permits: {
    permitNumber: string;
    permitType: string;
    validFrom: string;
    validTo: string;
    wasteTypes: string[];
  }[];
  serviceAreas: {
    type: 'polygon' | 'radius';
    coordinates: number[][];
    center?: {
      lat: number;
      lng: number;
    };
    radius?: number;
  }[];
  priceMatrix: {
    wasteType: string;
    basePrice: number;
    pricePerUnit: number;
    unit: 'kg' | 'm3' | 'truck';
    minimumCharge: number;
    additionalFees?: {
      name: string;
      amount: number;
    }[];
  }[];
  reliabilityScore?: number;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface CarrierSearchParams {
  wasteType?: string;
  lat?: number;
  lng?: number;
}

class CarriersService {
  async getCarriers(): Promise<Carrier[]> {
    const response = await apiClient.get('/carriers');
    return response.data;
  }

  async getCarrier(id: string): Promise<Carrier> {
    const response = await apiClient.get(`/carriers/${id}`);
    return response.data;
  }

  async createCarrier(carrierData: CreateCarrierRequest): Promise<Carrier> {
    const response = await apiClient.post('/carriers', carrierData);
    return response.data;
  }

  async updateCarrier(id: string, carrierData: Partial<CreateCarrierRequest>): Promise<Carrier> {
    const response = await apiClient.patch(`/carriers/${id}`, carrierData);
    return response.data;
  }

  async deleteCarrier(id: string): Promise<void> {
    await apiClient.delete(`/carriers/${id}`);
  }

  async searchCarriers(params: CarrierSearchParams): Promise<Carrier[]> {
    const searchParams = new URLSearchParams();
    if (params.wasteType) searchParams.append('wasteType', params.wasteType);
    if (params.lat) searchParams.append('lat', params.lat.toString());
    if (params.lng) searchParams.append('lng', params.lng.toString());

    const response = await apiClient.get(`/carriers/search?${searchParams.toString()}`);
    return response.data;
  }
}

export const carriersService = new CarriersService();
