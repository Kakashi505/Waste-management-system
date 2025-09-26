import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GpsEvent, GpsEventType, GpsEventStatus } from '../../database/entities/gps-event.entity';
import { Case } from '../../database/entities/case.entity';
import { CreateGpsEventDto } from './dto/create-gps-event.dto';

@Injectable()
export class GpsService {
  constructor(
    @InjectRepository(GpsEvent)
    private gpsEventRepository: Repository<GpsEvent>,
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
  ) {}

  async createEvent(createGpsEventDto: CreateGpsEventDto): Promise<GpsEvent> {
    // Verify case exists
    const case_ = await this.caseRepository.findOne({
      where: { id: createGpsEventDto.caseId },
    });

    if (!case_) {
      throw new NotFoundException('案件が見つかりません');
    }

    // Calculate distance from site
    const distanceFromSite = this.calculateDistance(
      createGpsEventDto.lat,
      createGpsEventDto.lng,
      case_.siteLat,
      case_.siteLng,
    );

    // Determine status based on distance threshold
    const thresholdDistance = createGpsEventDto.thresholdDistanceM || 100; // 100m default
    const status = distanceFromSite <= thresholdDistance ? GpsEventStatus.OK : GpsEventStatus.NG;

    const gpsEvent = this.gpsEventRepository.create({
      ...createGpsEventDto,
      distanceFromSiteM: distanceFromSite,
      status,
    });

    return this.gpsEventRepository.save(gpsEvent);
  }

  async findByCase(caseId: string): Promise<GpsEvent[]> {
    return this.gpsEventRepository.find({
      where: { caseId },
      order: { timestamp: 'DESC' },
    });
  }

  async findByDevice(deviceId: string, limit: number = 100): Promise<GpsEvent[]> {
    return this.gpsEventRepository.find({
      where: { deviceId },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  async getEventSummary(caseId: string): Promise<{
    totalEvents: number;
    okEvents: number;
    ngEvents: number;
    lastEvent?: GpsEvent;
    averageAccuracy: number;
  }> {
    const events = await this.findByCase(caseId);
    
    const totalEvents = events.length;
    const okEvents = events.filter(e => e.status === GpsEventStatus.OK).length;
    const ngEvents = events.filter(e => e.status === GpsEventStatus.NG).length;
    const lastEvent = events[0];
    const averageAccuracy = events.length > 0 
      ? events.reduce((sum, e) => sum + e.accuracyM, 0) / events.length 
      : 0;

    return {
      totalEvents,
      okEvents,
      ngEvents,
      lastEvent,
      averageAccuracy,
    };
  }

  async validateLocation(
    lat: number,
    lng: number,
    caseLat: number,
    caseLng: number,
    thresholdDistance: number = 100,
  ): Promise<{
    isValid: boolean;
    distance: number;
    status: GpsEventStatus;
  }> {
    const distance = this.calculateDistance(lat, lng, caseLat, caseLng);
    const isValid = distance <= thresholdDistance;
    const status = isValid ? GpsEventStatus.OK : GpsEventStatus.NG;

    return {
      isValid,
      distance,
      status,
    };
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
}
