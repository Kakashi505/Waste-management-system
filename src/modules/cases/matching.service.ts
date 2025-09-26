import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Case } from '../../database/entities/case.entity';
import { Carrier } from '../../database/entities/carrier.entity';

export interface MatchingResult {
  carrier: Carrier;
  score: number;
  reasons: string[];
}

export interface MatchingCriteria {
  maxDistance: number; // in meters
  minReliabilityScore: number;
  maxPrice?: number;
  requiredPermits?: string[];
}

@Injectable()
export class MatchingService {
  constructor(
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    @InjectRepository(Carrier)
    private carrierRepository: Repository<Carrier>,
  ) {}

  async findMatchingCarriers(
    caseId: string,
    criteria: MatchingCriteria = {
      maxDistance: 50000, // 50km
      minReliabilityScore: 0.5,
    },
  ): Promise<MatchingResult[]> {
    const case_ = await this.caseRepository.findOne({
      where: { id: caseId },
    });

    if (!case_) {
      throw new Error('案件が見つかりません');
    }

    // Get all active carriers
    const carriers = await this.carrierRepository.find({
      where: { isActive: true },
    });

    const results: MatchingResult[] = [];

    for (const carrier of carriers) {
      const result = await this.evaluateCarrier(case_, carrier, criteria);
      if (result) {
        results.push(result);
      }
    }

    // Sort by score (highest first)
    return results.sort((a, b) => b.score - a.score);
  }

  private async evaluateCarrier(
    case_: Case,
    carrier: Carrier,
    criteria: MatchingCriteria,
  ): Promise<MatchingResult | null> {
    const reasons: string[] = [];
    let score = 0;

    // Check if carrier has valid permits for this waste type
    const hasValidPermit = this.checkPermits(carrier, case_.wasteType);
    if (!hasValidPermit) {
      return null; // Skip this carrier
    }
    reasons.push('適切な許可証を保有');

    // Check service area
    const isInServiceArea = this.checkServiceArea(carrier, case_.siteLat, case_.siteLng);
    if (!isInServiceArea) {
      return null; // Skip this carrier
    }
    reasons.push('サービスエリア内');

    // Calculate distance score
    const distance = this.calculateDistance(
      case_.siteLat,
      case_.siteLng,
      carrier.serviceAreas[0]?.center?.lat || 0,
      carrier.serviceAreas[0]?.center?.lng || 0,
    );

    if (distance > criteria.maxDistance) {
      return null; // Skip this carrier
    }

    const distanceScore = Math.max(0, 100 - (distance / criteria.maxDistance) * 100);
    score += distanceScore * 0.3; // 30% weight for distance
    reasons.push(`距離スコア: ${distanceScore.toFixed(1)}`);

    // Calculate price score
    const priceScore = this.calculatePriceScore(carrier, case_);
    score += priceScore * 0.4; // 40% weight for price
    reasons.push(`価格スコア: ${priceScore.toFixed(1)}`);

    // Calculate reliability score
    const reliabilityScore = carrier.reliabilityScore * 100;
    if (reliabilityScore < criteria.minReliabilityScore * 100) {
      return null; // Skip this carrier
    }
    score += reliabilityScore * 0.3; // 30% weight for reliability
    reasons.push(`信頼性スコア: ${reliabilityScore.toFixed(1)}`);

    return {
      carrier,
      score: Math.round(score),
      reasons,
    };
  }

  private checkPermits(carrier: Carrier, wasteType: string): boolean {
    const now = new Date();
    return carrier.permits.some(permit => 
      permit.wasteTypes.includes(wasteType) &&
      new Date(permit.validFrom) <= now &&
      new Date(permit.validTo) >= now
    );
  }

  private checkServiceArea(carrier: Carrier, lat: number, lng: number): boolean {
    return carrier.serviceAreas.some(area => {
      if (area.type === 'radius' && area.center) {
        const distance = this.calculateDistance(lat, lng, area.center.lat, area.center.lng);
        return distance <= (area.radius || 0);
      } else if (area.type === 'polygon') {
        return this.isPointInPolygon(lat, lng, area.coordinates);
      }
      return false;
    });
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private isPointInPolygon(lat: number, lng: number, coordinates: number[][]): boolean {
    // Simple point-in-polygon test (Ray casting algorithm)
    let inside = false;
    for (let i = 0, j = coordinates.length - 1; i < coordinates.length; j = i++) {
      const xi = coordinates[i][0], yi = coordinates[i][1];
      const xj = coordinates[j][0], yj = coordinates[j][1];
      
      if (((yi > lng) !== (yj > lng)) && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  }

  private calculatePriceScore(carrier: Carrier, case_: Case): number {
    const priceMatrix = carrier.priceMatrix.find(pm => pm.wasteType === case_.wasteType);
    if (!priceMatrix) {
      return 0; // No price available for this waste type
    }

    // Calculate estimated price
    const estimatedPrice = priceMatrix.basePrice + 
      (case_.estimatedWeight || 1000) * priceMatrix.pricePerUnit;

    // Normalize price score (lower price = higher score)
    const maxPrice = 100000; // Assume max price for normalization
    const priceScore = Math.max(0, 100 - (estimatedPrice / maxPrice) * 100);
    
    return priceScore;
  }
}
