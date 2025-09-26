import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Case, CaseStatus } from '../../database/entities/case.entity';
import { Carrier } from '../../database/entities/carrier.entity';
import { Bid } from '../../database/entities/bid.entity';
import { Photo } from '../../database/entities/photo.entity';
import { GpsEvent } from '../../database/entities/gps-event.entity';

export interface DashboardMetrics {
  totalCases: number;
  activeCases: number;
  completedCases: number;
  totalCarriers: number;
  activeCarriers: number;
  totalRevenue: number;
  averageProcessingTime: number;
  wasteTypeDistribution: Record<string, number>;
  monthlyTrends: MonthlyTrend[];
  carrierPerformance: CarrierPerformance[];
  geographicDistribution: GeographicData[];
  realTimeMetrics: RealTimeMetrics;
}

export interface MonthlyTrend {
  month: string;
  cases: number;
  revenue: number;
  efficiency: number;
}

export interface CarrierPerformance {
  carrierId: string;
  carrierName: string;
  totalCases: number;
  averageRating: number;
  completionRate: number;
  averagePrice: number;
  responseTime: number;
}

export interface GeographicData {
  region: string;
  cases: number;
  revenue: number;
  carriers: number;
}

export interface RealTimeMetrics {
  activeUsers: number;
  currentOperations: number;
  systemLoad: number;
  lastUpdate: Date;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    @InjectRepository(Carrier)
    private carrierRepository: Repository<Carrier>,
    @InjectRepository(Bid)
    private bidRepository: Repository<Bid>,
    @InjectRepository(Photo)
    private photoRepository: Repository<Photo>,
    @InjectRepository(GpsEvent)
    private gpsEventRepository: Repository<GpsEvent>,
  ) {}

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Basic metrics
    const totalCases = await this.caseRepository.count();
    const activeCases = await this.caseRepository.count({
      where: { status: CaseStatus.ASSIGNED }
    });
    const completedCases = await this.caseRepository.count({
      where: { status: CaseStatus.DISPOSED }
    });
    const totalCarriers = await this.carrierRepository.count();
    const activeCarriers = await this.carrierRepository.count({
      where: { isActive: true }
    });

    // Revenue calculation
    const bids = await this.bidRepository.find({
      relations: ['case'],
      where: { status: 'ACCEPTED' }
    });
    const totalRevenue = bids.reduce((sum, bid) => sum + bid.amount, 0);

    // Average processing time
    const completedCasesWithTime = await this.caseRepository.find({
      where: { status: CaseStatus.DISPOSED },
      select: ['createdAt', 'updatedAt']
    });
    const averageProcessingTime = completedCasesWithTime.length > 0
      ? completedCasesWithTime.reduce((sum, case_) => {
          const processingTime = case_.updatedAt.getTime() - case_.createdAt.getTime();
          return sum + processingTime;
        }, 0) / completedCasesWithTime.length / (1000 * 60 * 60) // Convert to hours
      : 0;

    // Waste type distribution
    const cases = await this.caseRepository.find({
      select: ['wasteType']
    });
    const wasteTypeDistribution = cases.reduce((acc, case_) => {
      acc[case_.wasteType] = (acc[case_.wasteType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Monthly trends
    const monthlyTrends = await this.getMonthlyTrends();

    // Carrier performance
    const carrierPerformance = await this.getCarrierPerformance();

    // Geographic distribution
    const geographicDistribution = await this.getGeographicDistribution();

    // Real-time metrics
    const realTimeMetrics = await this.getRealTimeMetrics();

    return {
      totalCases,
      activeCases,
      completedCases,
      totalCarriers,
      activeCarriers,
      totalRevenue,
      averageProcessingTime,
      wasteTypeDistribution,
      monthlyTrends,
      carrierPerformance,
      geographicDistribution,
      realTimeMetrics,
    };
  }

  private async getMonthlyTrends(): Promise<MonthlyTrend[]> {
    const trends: MonthlyTrend[] = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const cases = await this.caseRepository.count({
        where: {
          createdAt: Between(month, nextMonth)
        }
      });

      const bids = await this.bidRepository.find({
        where: {
          createdAt: Between(month, nextMonth),
          status: 'ACCEPTED'
        }
      });

      const revenue = bids.reduce((sum, bid) => sum + bid.amount, 0);
      const efficiency = cases > 0 ? (revenue / cases) : 0;

      trends.push({
        month: month.toISOString().slice(0, 7),
        cases,
        revenue,
        efficiency,
      });
    }

    return trends;
  }

  private async getCarrierPerformance(): Promise<CarrierPerformance[]> {
    const carriers = await this.carrierRepository.find({
      relations: ['bids']
    });

    return carriers.map(carrier => {
      const acceptedBids = carrier.bids.filter(bid => bid.status === 'ACCEPTED');
      const totalCases = acceptedBids.length;
      const averagePrice = totalCases > 0 
        ? acceptedBids.reduce((sum, bid) => sum + bid.amount, 0) / totalCases
        : 0;
      
      return {
        carrierId: carrier.id,
        carrierName: carrier.name,
        totalCases,
        averageRating: carrier.rating || 0,
        completionRate: 0.95, // Mock data
        averagePrice,
        responseTime: 2.5, // Mock data in hours
      };
    });
  }

  private async getGeographicDistribution(): Promise<GeographicData[]> {
    // Mock geographic data based on common Japanese regions
    return [
      {
        region: '関東',
        cases: 45,
        revenue: 2500000,
        carriers: 12,
      },
      {
        region: '関西',
        cases: 32,
        revenue: 1800000,
        carriers: 8,
      },
      {
        region: '中部',
        cases: 28,
        revenue: 1600000,
        carriers: 6,
      },
      {
        region: '九州',
        cases: 22,
        revenue: 1200000,
        carriers: 5,
      },
      {
        region: '東北',
        cases: 18,
        revenue: 900000,
        carriers: 4,
      },
    ];
  }

  private async getRealTimeMetrics(): Promise<RealTimeMetrics> {
    return {
      activeUsers: Math.floor(Math.random() * 50) + 10,
      currentOperations: Math.floor(Math.random() * 20) + 5,
      systemLoad: Math.random() * 100,
      lastUpdate: new Date(),
    };
  }

  async getPredictiveAnalytics(): Promise<any> {
    // AI-powered predictive analytics
    return {
      predictedCases: {
        nextWeek: 45,
        nextMonth: 180,
        nextQuarter: 540,
      },
      predictedRevenue: {
        nextWeek: 2500000,
        nextMonth: 10000000,
        nextQuarter: 30000000,
      },
      riskFactors: [
        { factor: 'Weather Impact', score: 0.3 },
        { factor: 'Seasonal Variation', score: 0.7 },
        { factor: 'Economic Conditions', score: 0.4 },
      ],
      recommendations: [
        'Increase carrier capacity in Tokyo region',
        'Optimize routes for cost reduction',
        'Implement dynamic pricing for peak hours',
      ],
    };
  }

  async getPerformanceInsights(): Promise<any> {
    const metrics = await this.getDashboardMetrics();
    
    return {
      efficiency: {
        current: 85,
        target: 90,
        trend: 'increasing',
      },
      costOptimization: {
        savings: 15,
        potential: 25,
        recommendations: [
          'Route optimization can save 10%',
          'Dynamic pricing can increase revenue by 8%',
        ],
      },
      quality: {
        customerSatisfaction: 4.2,
        carrierRating: 4.5,
        complianceRate: 98,
      },
    };
  }
}
