import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { Tenant } from '../../database/entities/tenant.entity';
import { TenantUser } from '../../database/entities/tenant-user.entity';
import { TenantSettings } from '../../database/entities/tenant-settings.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, TenantUser, TenantSettings]),
  ],
  providers: [TenantsService],
  controllers: [TenantsController],
  exports: [TenantsService],
})
export class TenantsModule {}
