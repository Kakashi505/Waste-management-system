import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface RouteData {
  distance: number;
  duration: number;
  steps: RouteStep[];
  traffic: TrafficInfo;
  tolls: TollInfo[];
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  coordinates: { lat: number; lng: number }[];
}

export interface TrafficInfo {
  level: 'light' | 'moderate' | 'heavy' | 'severe';
  delay: number;
  alternativeRoutes: number;
}

export interface TollInfo {
  name: string;
  cost: number;
  location: { lat: number; lng: number };
}

export interface GeocodingResult {
  address: string;
  coordinates: { lat: number; lng: number };
  formattedAddress: string;
  components: {
    prefecture: string;
    city: string;
    district: string;
    postalCode: string;
  };
}

@Injectable()
export class MapsService {
  constructor(private readonly httpService: HttpService) {}

  async getRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    waypoints?: { lat: number; lng: number }[]
  ): Promise<RouteData> {
    try {
      // Mock route calculation (in real implementation, use Google Maps API)
      const distance = this.calculateDistance(origin, destination);
      const duration = distance / 30; // Assuming 30 km/h average speed
      
      const steps = this.generateRouteSteps(origin, destination);
      const traffic = this.getTrafficInfo();
      const tolls = this.getTollInfo();

      return {
        distance,
        duration,
        steps,
        traffic,
        tolls,
      };
    } catch (error) {
      throw new Error('Failed to calculate route');
    }
  }

  async geocodeAddress(address: string): Promise<GeocodingResult> {
    try {
      // Mock geocoding (in real implementation, use Google Maps Geocoding API)
      const mockCoordinates = {
        lat: 35.6762 + (Math.random() - 0.5) * 0.1,
        lng: 139.6503 + (Math.random() - 0.5) * 0.1,
      };

      return {
        address,
        coordinates: mockCoordinates,
        formattedAddress: `${address}, 日本`,
        components: {
          prefecture: '東京都',
          city: '渋谷区',
          district: '恵比寿',
          postalCode: '150-0013',
        },
      };
    } catch (error) {
      throw new Error('Failed to geocode address');
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult> {
    try {
      // Mock reverse geocoding
      const mockAddress = `東京都渋谷区恵比寿${Math.floor(Math.random() * 10) + 1}-${Math.floor(Math.random() * 10) + 1}-${Math.floor(Math.random() * 10) + 1}`;

      return {
        address: mockAddress,
        coordinates: { lat, lng },
        formattedAddress: `${mockAddress}, 日本`,
        components: {
          prefecture: '東京都',
          city: '渋谷区',
          district: '恵比寿',
          postalCode: '150-0013',
        },
      };
    } catch (error) {
      throw new Error('Failed to reverse geocode');
    }
  }

  async getNearbyCarriers(
    location: { lat: number; lng: number },
    radius: number = 10
  ): Promise<any[]> {
    // Mock nearby carriers search
    const carriers = [];
    const count = Math.floor(Math.random() * 5) + 3;

    for (let i = 0; i < count; i++) {
      const carrierLat = location.lat + (Math.random() - 0.5) * 0.02;
      const carrierLng = location.lng + (Math.random() - 0.5) * 0.02;
      const distance = this.calculateDistance(location, { lat: carrierLat, lng: carrierLng });

      if (distance <= radius) {
        carriers.push({
          id: `carrier-${i}`,
          name: `業者${i + 1}`,
          coordinates: { lat: carrierLat, lng: carrierLng },
          distance,
          rating: 3.5 + Math.random() * 1.5,
          specialties: ['一般廃棄物', '産業廃棄物'],
          availability: Math.random() > 0.3,
        });
      }
    }

    return carriers.sort((a, b) => a.distance - b.distance);
  }

  async getTrafficConditions(route: RouteStep[]): Promise<TrafficInfo> {
    // Mock traffic analysis
    const delay = Math.random() * 30; // 0-30 minutes delay
    let level: 'light' | 'moderate' | 'heavy' | 'severe';

    if (delay < 5) level = 'light';
    else if (delay < 15) level = 'moderate';
    else if (delay < 25) level = 'heavy';
    else level = 'severe';

    return {
      level,
      delay,
      alternativeRoutes: Math.floor(Math.random() * 3) + 1,
    };
  }

  private calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private generateRouteSteps(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }): RouteStep[] {
    const steps = [];
    const numSteps = Math.floor(Math.random() * 5) + 3;

    for (let i = 0; i < numSteps; i++) {
      const progress = i / (numSteps - 1);
      const lat = origin.lat + (destination.lat - origin.lat) * progress;
      const lng = origin.lng + (destination.lng - origin.lng) * progress;

      steps.push({
        instruction: `ステップ${i + 1}: 直進`,
        distance: this.calculateDistance(origin, destination) / numSteps,
        duration: (this.calculateDistance(origin, destination) / numSteps) / 30 * 60, // Convert to minutes
        coordinates: [{ lat, lng }],
      });
    }

    return steps;
  }

  private getTrafficInfo(): TrafficInfo {
    const levels = ['light', 'moderate', 'heavy', 'severe'];
    const level = levels[Math.floor(Math.random() * levels.length)] as any;
    const delay = Math.random() * 30;

    return {
      level,
      delay,
      alternativeRoutes: Math.floor(Math.random() * 3) + 1,
    };
  }

  private getTollInfo(): TollInfo[] {
    const tolls = [];
    const numTolls = Math.floor(Math.random() * 3);

    for (let i = 0; i < numTolls; i++) {
      tolls.push({
        name: `料金所${i + 1}`,
        cost: 500 + Math.random() * 1000,
        location: {
          lat: 35.6762 + (Math.random() - 0.5) * 0.1,
          lng: 139.6503 + (Math.random() - 0.5) * 0.1,
        },
      });
    }

    return tolls;
  }
}
