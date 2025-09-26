import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    return await this.cacheManager.get<T>(key);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async reset(): Promise<void> {
    await this.cacheManager.reset();
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    let value = await this.get<T>(key);
    
    if (value === undefined) {
      value = await factory();
      await this.set(key, value, ttl);
    }
    
    return value;
  }

  // Cache key generators
  static generateKey(prefix: string, ...params: any[]): string {
    return `${prefix}:${params.join(':')}`;
  }

  static generateUserKey(userId: string): string {
    return this.generateKey('user', userId);
  }

  static generateCaseKey(caseId: string): string {
    return this.generateKey('case', caseId);
  }

  static generateCarrierKey(carrierId: string): string {
    return this.generateKey('carrier', carrierId);
  }

  static generateAnalyticsKey(type: string, period: string): string {
    return this.generateKey('analytics', type, period);
  }

  static generateWeatherKey(lat: number, lng: number): string {
    return this.generateKey('weather', lat.toFixed(2), lng.toFixed(2));
  }

  static generateRouteKey(origin: string, destination: string): string {
    return this.generateKey('route', origin, destination);
  }
}
