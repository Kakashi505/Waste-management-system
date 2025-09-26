import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GpsEvent } from '../../database/entities/gps-event.entity';
import { Case } from '../../database/entities/case.entity';
import { GpsService } from './gps.service';
import { GpsController } from './gps.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GpsEvent, Case])],
  providers: [GpsService],
  controllers: [GpsController],
  exports: [GpsService],
})
export class GpsModule {}
