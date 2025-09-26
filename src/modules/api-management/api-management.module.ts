import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiManagementService } from './api-management.service';
import { ApiManagementController } from './api-management.controller';
import { RateLimitService } from './rate-limit.service';
import { ApiKey } from '../../database/entities/api-key.entity';
import { ApiUsage } from '../../database/entities/api-usage.entity';
import { Tenant } from '../../database/entities/tenant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApiKey, ApiUsage, Tenant]),
  ],
  providers: [ApiManagementService, RateLimitService],
  controllers: [ApiManagementController],
  exports: [ApiManagementService, RateLimitService],
})
export class ApiManagementModule {}
