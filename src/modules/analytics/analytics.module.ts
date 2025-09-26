import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Case } from '../../database/entities/case.entity';
import { Carrier } from '../../database/entities/carrier.entity';
import { Bid } from '../../database/entities/bid.entity';
import { Photo } from '../../database/entities/photo.entity';
import { GpsEvent } from '../../database/entities/gps-event.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Case, Carrier, Bid, Photo, GpsEvent]),
  ],
  providers: [AnalyticsService],
  controllers: [AnalyticsController],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
