import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Case } from '../../database/entities/case.entity';
import { Carrier } from '../../database/entities/carrier.entity';
import { Bid } from '../../database/entities/bid.entity';

export interface WasteClassification {
  category: string;
  subcategory: string;
  confidence: number;
  disposalMethod: string;
  estimatedWeight: number;
  hazardousLevel: 'low' | 'medium' | 'high';
  recyclingPotential: number;
}

export interface RouteOptimization {
  optimizedRoute: {
    lat: number;
    lng: number;
    address: string;
    estimatedTime: number;
    wasteType: string;
  }[];
  totalDistance: number;
  totalTime: number;
  fuelCost: number;
  efficiency: number;
}

export interface DynamicPricing {
  basePrice: number;
  adjustedPrice: number;
  factors: {
    demand: number;
    supply: number;
    weather: number;
    timeOfDay: number;
    distance: number;
  };
  recommendations: string[];
}

@Injectable()
export class AiService {
  constructor(
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    @InjectRepository(Carrier)
    private carrierRepository: Repository<Carrier>,
    @InjectRepository(Bid)
    private bidRepository: Repository<Bid>,
  ) {}

  async classifyWaste(description: string, imageData?: string): Promise<WasteClassification> {
    // AI-powered waste classification
    const keywords = description.toLowerCase();
    
    let category = '一般廃棄物';
    let subcategory = '可燃ごみ';
    let confidence = 0.8;
    let disposalMethod = '焼却処理';
    let estimatedWeight = 50;
    let hazardousLevel: 'low' | 'medium' | 'high' = 'low';
    let recyclingPotential = 0.3;

    // Simple keyword-based classification (in real implementation, use ML model)
    if (keywords.includes('プラスチック') || keywords.includes('pet')) {
      category = '産業廃棄物';
      subcategory = 'プラスチック類';
      disposalMethod = 'リサイクル処理';
      recyclingPotential = 0.9;
    } else if (keywords.includes('金属') || keywords.includes('鉄')) {
      category = '産業廃棄物';
      subcategory = '金属類';
      disposalMethod = 'リサイクル処理';
      recyclingPotential = 0.95;
    } else if (keywords.includes('危険') || keywords.includes('化学')) {
      category = '特別管理産業廃棄物';
      subcategory = '有害物質';
      hazardousLevel = 'high';
      disposalMethod = '特別処理';
      confidence = 0.9;
    } else if (keywords.includes('紙') || keywords.includes('段ボール')) {
      category = '一般廃棄物';
      subcategory = '紙類';
      disposalMethod = 'リサイクル処理';
      recyclingPotential = 0.8;
    }

    return {
      category,
      subcategory,
      confidence,
      disposalMethod,
      estimatedWeight,
      hazardousLevel,
      recyclingPotential,
    };
  }

  async optimizeRoute(cases: Case[]): Promise<RouteOptimization> {
    // AI-powered route optimization using TSP algorithm
    const locations = cases.map(case_ => ({
      lat: case_.siteLat,
      lng: case_.siteLng,
      address: case_.siteAddress,
      wasteType: case_.wasteType,
    }));

    // Simple nearest neighbor algorithm (in real implementation, use advanced optimization)
    const optimizedRoute = this.nearestNeighborOptimization(locations);
    
    const totalDistance = this.calculateTotalDistance(optimizedRoute);
    const totalTime = totalDistance / 30; // Assuming 30 km/h average speed
    const fuelCost = totalDistance * 0.15; // 15 yen per km
    const efficiency = 100 - (totalDistance / 100); // Efficiency percentage

    return {
      optimizedRoute,
      totalDistance,
      totalTime,
      fuelCost,
      efficiency: Math.max(0, efficiency),
    };
  }

  private nearestNeighborOptimization(locations: any[]): any[] {
    if (locations.length === 0) return [];
    
    const route = [locations[0]];
    const remaining = [...locations.slice(1)];
    
    while (remaining.length > 0) {
      const current = route[route.length - 1];
      let nearestIndex = 0;
      let nearestDistance = this.calculateDistance(current, remaining[0]);
      
      for (let i = 1; i < remaining.length; i++) {
        const distance = this.calculateDistance(current, remaining[i]);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }
      
      route.push(remaining[nearestIndex]);
      remaining.splice(nearestIndex, 1);
    }
    
    return route.map((location, index) => ({
      ...location,
      estimatedTime: index * 30, // 30 minutes per stop
    }));
  }

  private calculateDistance(point1: any, point2: any): number {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private calculateTotalDistance(route: any[]): number {
    let total = 0;
    for (let i = 0; i < route.length - 1; i++) {
      total += this.calculateDistance(route[i], route[i + 1]);
    }
    return total;
  }

  async calculateDynamicPricing(case_: Case, carrier: Carrier): Promise<DynamicPricing> {
    // AI-powered dynamic pricing
    const basePrice = 5000;
    
    // Calculate demand factor
    const demand = await this.calculateDemand(case_.siteLat, case_.siteLng);
    
    // Calculate supply factor
    const supply = await this.calculateSupply(case_.siteLat, case_.siteLng);
    
    // Weather factor (mock data)
    const weather = this.getWeatherFactor();
    
    // Time of day factor
    const timeOfDay = this.getTimeOfDayFactor();
    
    // Distance factor
    const distance = this.calculateDistanceToCarrier(case_, carrier);
    
    // Calculate adjusted price
    const factors = {
      demand: demand,
      supply: supply,
      weather: weather,
      timeOfDay: timeOfDay,
      distance: distance,
    };
    
    const adjustedPrice = basePrice * (1 + (demand - supply) * 0.1 + weather * 0.05 + timeOfDay * 0.03 + distance * 0.02);
    
    const recommendations = this.generatePricingRecommendations(factors);
    
    return {
      basePrice,
      adjustedPrice: Math.round(adjustedPrice),
      factors,
      recommendations,
    };
  }

  private async calculateDemand(lat: number, lng: number): Promise<number> {
    // Mock demand calculation based on location and time
    const now = new Date();
    const hour = now.getHours();
    
    // Higher demand during business hours
    const timeFactor = hour >= 9 && hour <= 17 ? 1.2 : 0.8;
    
    // Higher demand in urban areas (Tokyo area)
    const locationFactor = lat > 35.6 && lat < 35.8 && lng > 139.6 && lng < 139.8 ? 1.3 : 1.0;
    
    return timeFactor * locationFactor;
  }

  private async calculateSupply(lat: number, lng: number): Promise<number> {
    // Mock supply calculation
    const carriers = await this.carrierRepository.count({
      where: { isActive: true }
    });
    
    return carriers / 10; // Normalize to 0-1 range
  }

  private getWeatherFactor(): number {
    // Mock weather factor (-0.2 to 0.2)
    return (Math.random() - 0.5) * 0.4;
  }

  private getTimeOfDayFactor(): number {
    const hour = new Date().getHours();
    
    if (hour >= 6 && hour <= 9) return 0.1; // Morning rush
    if (hour >= 17 && hour <= 20) return 0.1; // Evening rush
    if (hour >= 22 || hour <= 5) return -0.1; // Night discount
    return 0; // Normal hours
  }

  private calculateDistanceToCarrier(case_: Case, carrier: Carrier): number {
    // Mock distance calculation
    return Math.random() * 0.5; // 0-0.5 factor
  }

  private generatePricingRecommendations(factors: any): string[] {
    const recommendations = [];
    
    if (factors.demand > 1.2) {
      recommendations.push('高需要のため価格を上げることを検討');
    }
    if (factors.supply < 0.8) {
      recommendations.push('供給不足のため価格を調整');
    }
    if (factors.weather > 0.1) {
      recommendations.push('悪天候のため価格を上げることを検討');
    }
    if (factors.timeOfDay > 0.05) {
      recommendations.push('ラッシュ時間のため価格を調整');
    }
    
    return recommendations;
  }

  async predictMaintenance(carrierId: string): Promise<any> {
    // AI-powered maintenance prediction
    return {
      carrierId,
      nextMaintenance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      riskLevel: 'low',
      recommendations: [
        '定期点検を実施',
        'オイル交換を推奨',
        'タイヤの摩耗を確認',
      ],
      predictedCost: 50000,
    };
  }

  async optimizeCarrierAssignment(case_: Case): Promise<Carrier[]> {
    // AI-powered carrier assignment optimization
    const carriers = await this.carrierRepository.find({
      where: { isActive: true }
    });
    
    // Score carriers based on multiple factors
    const scoredCarriers = carriers.map(carrier => {
      const distance = this.calculateDistanceToCarrier(case_, carrier);
      const rating = carrier.rating || 0;
      const availability = Math.random(); // Mock availability
      
      const score = (rating * 0.4) + ((1 - distance) * 0.3) + (availability * 0.3);
      
      return {
        ...carrier,
        score,
        estimatedPrice: 5000 + Math.random() * 2000,
        estimatedTime: 2 + Math.random() * 3,
      };
    });
    
    // Sort by score and return top 5
    return scoredCarriers
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }
}
