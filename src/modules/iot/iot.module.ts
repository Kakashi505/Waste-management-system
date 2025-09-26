import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IotService } from './iot.service';
import { IotController } from './iot.controller';
import { SensorService } from './sensor.service';
import { DeviceService } from './device.service';
import { TelemetryService } from './telemetry.service';
import { Case } from '../../database/entities/case.entity';
import { Carrier } from '../../database/entities/carrier.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Case, Carrier]),
  ],
  providers: [IotService, SensorService, DeviceService, TelemetryService],
  controllers: [IotController],
  exports: [IotService, SensorService, DeviceService, TelemetryService],
})
export class IotModule {}
