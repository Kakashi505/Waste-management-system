import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Carrier, Permit, ServiceArea, PriceMatrix } from '../../database/entities/carrier.entity';
import { CreateCarrierDto } from './dto/create-carrier.dto';
import { UpdateCarrierDto } from './dto/update-carrier.dto';

@Injectable()
export class CarriersService {
  constructor(
    @InjectRepository(Carrier)
    private carrierRepository: Repository<Carrier>,
  ) {}

  async create(createCarrierDto: CreateCarrierDto): Promise<Carrier> {
    const carrier = this.carrierRepository.create(createCarrierDto);
    return this.carrierRepository.save(carrier);
  }

  async findAll(): Promise<Carrier[]> {
    return this.carrierRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Carrier> {
    const carrier = await this.carrierRepository.findOne({
      where: { id, isActive: true },
    });

    if (!carrier) {
      throw new NotFoundException('収集運搬業者が見つかりません');
    }

    return carrier;
  }

  async update(id: string, updateCarrierDto: UpdateCarrierDto): Promise<Carrier> {
    const carrier = await this.findOne(id);
    Object.assign(carrier, updateCarrierDto);
    return this.carrierRepository.save(carrier);
  }

  async remove(id: string): Promise<void> {
    await this.carrierRepository.update(id, { isActive: false });
  }

  async findByWasteType(wasteType: string): Promise<Carrier[]> {
    return this.carrierRepository
      .createQueryBuilder('carrier')
      .where('carrier.isActive = :isActive', { isActive: true })
      .andWhere('JSON_EXTRACT(carrier.permits, "$[*].wasteTypes") LIKE :wasteType', {
        wasteType: `%${wasteType}%`,
      })
      .getMany();
  }

  async findByLocation(lat: number, lng: number): Promise<Carrier[]> {
    const carriers = await this.carrierRepository.find({
      where: { isActive: true },
    });

    return carriers.filter(carrier => 
      this.isInServiceArea(carrier, lat, lng)
    );
  }

  private isInServiceArea(carrier: Carrier, lat: number, lng: number): boolean {
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
}
