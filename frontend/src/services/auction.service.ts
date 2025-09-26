import apiClient from './api';

export interface Bid {
  id: string;
  caseId: string;
  carrierId: string;
  carrier: {
    id: string;
    name: string;
    companyCode: string;
  };
  amount: number;
  message?: string;
  status: '提出済み' | '受注' | '落札' | 'キャンセル';
  createdAt: string;
  updatedAt: string;
}

export interface CreateBidRequest {
  caseId: string;
  amount: number;
  message?: string;
}

export interface AuctionStatus {
  isOpen: boolean;
  timeRemaining?: number;
  bidCount: number;
  lowestBid?: number;
  highestBid?: number;
}

class AuctionService {
  async createBid(bidData: CreateBidRequest): Promise<Bid> {
    const response = await apiClient.post('/auction/bids', bidData);
    return response.data;
  }

  async getBidsByCase(caseId: string): Promise<Bid[]> {
    const response = await apiClient.get(`/auction/bids/case/${caseId}`);
    return response.data;
  }

  async getBidsByCarrier(carrierId: string): Promise<Bid[]> {
    const response = await apiClient.get(`/auction/bids/carrier/${carrierId}`);
    return response.data;
  }

  async cancelBid(bidId: string): Promise<void> {
    await apiClient.delete(`/auction/bids/${bidId}`);
  }

  async closeAuction(caseId: string): Promise<Bid | null> {
    const response = await apiClient.post(`/auction/close/${caseId}`);
    return response.data;
  }

  async getAuctionStatus(caseId: string): Promise<AuctionStatus> {
    const response = await apiClient.get(`/auction/status/${caseId}`);
    return response.data;
  }
}

export const auctionService = new AuctionService();
