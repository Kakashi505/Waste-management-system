import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from '../../database/entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(
    entity: string,
    entityId: string,
    action: AuditAction,
    actorId: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      entity,
      entityId,
      action,
      actorId,
      oldValues,
      newValues,
      ipAddress,
      userAgent,
    });

    return this.auditLogRepository.save(auditLog);
  }

  async findByEntity(entity: string, entityId: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { entity, entityId },
      relations: ['actor'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByActor(actorId: string, limit: number = 100): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { actorId },
      relations: ['actor'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByAction(action: AuditAction, limit: number = 100): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { action },
      relations: ['actor'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    limit: number = 1000,
  ): Promise<AuditLog[]> {
    return this.auditLogRepository
      .createQueryBuilder('auditLog')
      .leftJoinAndSelect('auditLog.actor', 'actor')
      .where('auditLog.createdAt >= :startDate', { startDate })
      .andWhere('auditLog.createdAt <= :endDate', { endDate })
      .orderBy('auditLog.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }

  async getAuditSummary(entity?: string, entityId?: string): Promise<{
    totalLogs: number;
    actionsCount: Record<string, number>;
    recentLogs: AuditLog[];
  }> {
    const query = this.auditLogRepository.createQueryBuilder('auditLog');

    if (entity) {
      query.andWhere('auditLog.entity = :entity', { entity });
    }

    if (entityId) {
      query.andWhere('auditLog.entityId = :entityId', { entityId });
    }

    const logs = await query
      .leftJoinAndSelect('auditLog.actor', 'actor')
      .orderBy('auditLog.createdAt', 'DESC')
      .limit(100)
      .getMany();

    const totalLogs = logs.length;
    const actionsCount: Record<string, number> = {};

    logs.forEach(log => {
      actionsCount[log.action] = (actionsCount[log.action] || 0) + 1;
    });

    return {
      totalLogs,
      actionsCount,
      recentLogs: logs.slice(0, 10),
    };
  }
}
