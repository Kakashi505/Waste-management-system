import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Case } from '../../database/entities/case.entity';
import { Carrier } from '../../database/entities/carrier.entity';
import { Photo } from '../../database/entities/photo.entity';
import { GpsEvent } from '../../database/entities/gps-event.entity';
import { Bid } from '../../database/entities/bid.entity';
import { JwnetJob } from '../../database/entities/jwnet-job.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Case, Carrier, Photo, GpsEvent, Bid, JwnetJob])],
  providers: [ReportsService],
  controllers: [ReportsController],
  exports: [ReportsService],
})
export class ReportsModule {}
