import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { JwnetJob } from '../../database/entities/jwnet-job.entity';
import { Case } from '../../database/entities/case.entity';
import { JwnetService } from './jwnet.service';
import { JwnetController } from './jwnet.controller';
import { JwnetProcessor } from './jwnet.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([JwnetJob, Case]),
    BullModule.registerQueue({
      name: 'jwnet',
    }),
  ],
  providers: [JwnetService, JwnetProcessor],
  controllers: [JwnetController],
  exports: [JwnetService],
})
export class JwnetModule {}
