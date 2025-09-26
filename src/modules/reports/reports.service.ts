import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Case, CaseStatus } from '../../database/entities/case.entity';
import { Carrier } from '../../database/entities/carrier.entity';
import { Photo, PhotoStatus } from '../../database/entities/photo.entity';
import { GpsEvent, GpsEventStatus } from '../../database/entities/gps-event.entity';
import { Bid, BidStatus } from '../../database/entities/bid.entity';
import { JwnetJob, JwnetJobStatus } from '../../database/entities/jwnet-job.entity';

export interface DashboardStats {
  totalCases: number;
  activeCases: number;
  completedCases: number;
  totalCarriers: number;
  activeCarriers: number;
  totalPhotos: number;
  verifiedPhotos: number;
  totalGpsEvents: number;
  validGpsEvents: number;
  totalBids: number;
  activeBids: number;
  totalJwnetJobs: number;
  completedJwnetJobs: number;
}

export interface CaseStatusStats {
  status: CaseStatus;
  count: number;
  percentage: number;
}

export interface MonthlyStats {
  month: string;
  cases: number;
  photos: number;
  gpsEvents: number;
  bids: number;
}

export interface CarrierPerformance {
  carrierId: string;
  carrierName: string;
  totalCases: number;
  completedCases: number;
  averageCompletionTime: number;
  reliabilityScore: number;
  totalBids: number;
  wonBids: number;
  winRate: number;
}

export interface WasteTypeStats {
  wasteType: string;
  count: number;
  percentage: number;
  averageWeight: number;
  averageVolume: number;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    @InjectRepository(Carrier)
    private carrierRepository: Repository<Carrier>,
    @InjectRepository(Photo)
    private photoRepository: Repository<Photo>,
    @InjectRepository(GpsEvent)
    private gpsEventRepository: Repository<GpsEvent>,
    @InjectRepository(Bid)
    private bidRepository: Repository<Bid>,
    @InjectRepository(JwnetJob)
    private jwnetJobRepository: Repository<JwnetJob>,
  ) {}

  async getDashboardStats(): Promise<DashboardStats> {
    const [
      totalCases,
      activeCases,
      completedCases,
      totalCarriers,
      activeCarriers,
      totalPhotos,
      verifiedPhotos,
      totalGpsEvents,
      validGpsEvents,
      totalBids,
      activeBids,
      totalJwnetJobs,
      completedJwnetJobs,
    ] = await Promise.all([
      this.caseRepository.count(),
      this.caseRepository.count({ where: { status: CaseStatus.MATCHING } }),
      this.caseRepository.count({ where: { status: CaseStatus.DISPOSED } }),
      this.carrierRepository.count(),
      this.carrierRepository.count({ where: { isActive: true } }),
      this.photoRepository.count(),
      this.photoRepository.count({ where: { status: PhotoStatus.VERIFIED } }),
      this.gpsEventRepository.count(),
      this.gpsEventRepository.count({ where: { status: GpsEventStatus.OK } }),
      this.bidRepository.count(),
      this.bidRepository.count({ where: { status: BidStatus.SUBMITTED } }),
      this.jwnetJobRepository.count(),
      this.jwnetJobRepository.count({ where: { status: JwnetJobStatus.COMPLETED } }),
    ]);

    return {
      totalCases,
      activeCases,
      completedCases,
      totalCarriers,
      activeCarriers,
      totalPhotos,
      verifiedPhotos,
      totalGpsEvents,
      validGpsEvents,
      totalBids,
      activeBids,
      totalJwnetJobs,
      completedJwnetJobs,
    };
  }

  async getCaseStatusStats(): Promise<CaseStatusStats[]> {
    const statusCounts = await this.caseRepository
      .createQueryBuilder('case')
      .select('case.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('case.status')
      .getRawMany();

    const total = statusCounts.reduce((sum, item) => sum + parseInt(item.count), 0);

    return statusCounts.map(item => ({
      status: item.status,
      count: parseInt(item.count),
      percentage: total > 0 ? (parseInt(item.count) / total) * 100 : 0,
    }));
  }

  async getMonthlyStats(year: number): Promise<MonthlyStats[]> {
    const months = [];
    for (let month = 1; month <= 12; month++) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const [cases, photos, gpsEvents, bids] = await Promise.all([
        this.caseRepository.count({
          where: { createdAt: Between(startDate, endDate) },
        }),
        this.photoRepository.count({
          where: { createdAt: Between(startDate, endDate) },
        }),
        this.gpsEventRepository.count({
          where: { createdAt: Between(startDate, endDate) },
        }),
        this.bidRepository.count({
          where: { createdAt: Between(startDate, endDate) },
        }),
      ]);

      months.push({
        month: `${year}-${month.toString().padStart(2, '0')}`,
        cases,
        photos,
        gpsEvents,
        bids,
      });
    }

    return months;
  }

  async getCarrierPerformance(): Promise<CarrierPerformance[]> {
    const carriers = await this.carrierRepository.find({
      where: { isActive: true },
    });

    const performance = await Promise.all(
      carriers.map(async (carrier) => {
        const [totalCases, completedCases, totalBids, wonBids] = await Promise.all([
          this.caseRepository.count({ where: { assignedCarrierId: carrier.id } }),
          this.caseRepository.count({
            where: { assignedCarrierId: carrier.id, status: CaseStatus.DISPOSED },
          }),
          this.bidRepository.count({ where: { carrierId: carrier.id } }),
          this.bidRepository.count({
            where: { carrierId: carrier.id, status: BidStatus.WON },
          }),
        ]);

        // 平均完了時間の計算（簡略化）
        const averageCompletionTime = completedCases > 0 ? 24 : 0; // 仮の値

        return {
          carrierId: carrier.id,
          carrierName: carrier.name,
          totalCases,
          completedCases,
          averageCompletionTime,
          reliabilityScore: carrier.reliabilityScore,
          totalBids,
          wonBids,
          winRate: totalBids > 0 ? (wonBids / totalBids) * 100 : 0,
        };
      }),
    );

    return performance.sort((a, b) => b.reliabilityScore - a.reliabilityScore);
  }

  async getWasteTypeStats(): Promise<WasteTypeStats[]> {
    const wasteTypeStats = await this.caseRepository
      .createQueryBuilder('case')
      .select('case.wasteType', 'wasteType')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(case.estimatedWeight)', 'averageWeight')
      .addSelect('AVG(case.estimatedVolume)', 'averageVolume')
      .groupBy('case.wasteType')
      .getRawMany();

    const total = wasteTypeStats.reduce((sum, item) => sum + parseInt(item.count), 0);

    return wasteTypeStats.map(item => ({
      wasteType: item.wasteType,
      count: parseInt(item.count),
      percentage: total > 0 ? (parseInt(item.count) / total) * 100 : 0,
      averageWeight: parseFloat(item.averageWeight) || 0,
      averageVolume: parseFloat(item.averageVolume) || 0,
    }));
  }

  async getRecentActivity(limit: number = 10): Promise<any[]> {
    const [recentCases, recentPhotos, recentGpsEvents, recentBids] = await Promise.all([
      this.caseRepository.find({
        take: limit,
        order: { createdAt: 'DESC' },
        relations: ['createdBy', 'assignedCarrier'],
      }),
      this.photoRepository.find({
        take: limit,
        order: { createdAt: 'DESC' },
        relations: ['case_', 'uploader'],
      }),
      this.gpsEventRepository.find({
        take: limit,
        order: { createdAt: 'DESC' },
        relations: ['case_'],
      }),
      this.bidRepository.find({
        take: limit,
        order: { createdAt: 'DESC' },
        relations: ['case_', 'carrier'],
      }),
    ]);

    const activities = [
      ...recentCases.map(case_ => ({
        type: 'case',
        action: 'created',
        data: case_,
        timestamp: case_.createdAt,
      })),
      ...recentPhotos.map(photo => ({
        type: 'photo',
        action: 'uploaded',
        data: photo,
        timestamp: photo.createdAt,
      })),
      ...recentGpsEvents.map(event => ({
        type: 'gps',
        action: 'recorded',
        data: event,
        timestamp: event.createdAt,
      })),
      ...recentBids.map(bid => ({
        type: 'bid',
        action: 'submitted',
        data: bid,
        timestamp: bid.createdAt,
      })),
    ];

    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }
}
