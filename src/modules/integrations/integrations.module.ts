import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { WeatherService } from './weather.service';
import { MapsService } from './maps.service';
import { PaymentService } from './payment.service';
import { Case } from '../../database/entities/case.entity';
import { Carrier } from '../../database/entities/carrier.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Case, Carrier]),
  ],
  providers: [IntegrationsService, WeatherService, MapsService, PaymentService],
  controllers: [IntegrationsController],
  exports: [IntegrationsService, WeatherService, MapsService, PaymentService],
})
export class IntegrationsModule {}
