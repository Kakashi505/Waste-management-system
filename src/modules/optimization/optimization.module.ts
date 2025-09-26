import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OptimizationService } from './optimization.service';
import { OptimizationController } from './optimization.controller';
import { DatabaseOptimizationService } from './database-optimization.service';
import { QueryOptimizationService } from './query-optimization.service';
import { CacheOptimizationService } from './cache-optimization.service';
import { Case } from '../../database/entities/case.entity';
import { Carrier } from '../../database/entities/carrier.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Case, Carrier]),
  ],
  providers: [OptimizationService, DatabaseOptimizationService, QueryOptimizationService, CacheOptimizationService],
  controllers: [OptimizationController],
  exports: [OptimizationService, DatabaseOptimizationService, QueryOptimizationService, CacheOptimizationService],
})
export class OptimizationModule {}
