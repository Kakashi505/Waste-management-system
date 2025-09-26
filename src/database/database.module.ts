import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './entities/user.entity';
import { Carrier } from './entities/carrier.entity';
import { Case } from './entities/case.entity';
import { Bid } from './entities/bid.entity';
import { Photo } from './entities/photo.entity';
import { GpsEvent } from './entities/gps-event.entity';
import { JwnetJob } from './entities/jwnet-job.entity';
import { AuditLog } from './entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Carrier,
      Case,
      Bid,
      Photo,
      GpsEvent,
      JwnetJob,
      AuditLog,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
