import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SsoService } from './sso.service';
import { SsoController } from './sso.controller';
import { SamlService } from './saml.service';
import { OidcService } from './oidc.service';
import { User } from '../../database/entities/user.entity';
import { Tenant } from '../../database/entities/tenant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Tenant]),
  ],
  providers: [SsoService, SamlService, OidcService],
  controllers: [SsoController],
  exports: [SsoService, SamlService, OidcService],
})
export class SsoModule {}
