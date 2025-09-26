import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditAction } from '../../database/entities/audit-log.entity';

@ApiTags('audit')
@Controller('audit')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs/entity')
  @ApiOperation({ summary: 'エンティティの監査ログ取得' })
  @ApiQuery({ name: 'entity', description: 'エンティティ名' })
  @ApiQuery({ name: 'entityId', description: 'エンティティID' })
  @ApiResponse({ status: 200, description: '監査ログ取得成功' })
  async findByEntity(
    @Query('entity') entity: string,
    @Query('entityId') entityId: string,
  ) {
    return this.auditService.findByEntity(entity, entityId);
  }

  @Get('logs/actor/:actorId')
  @ApiOperation({ summary: 'アクターの監査ログ取得' })
  @ApiQuery({ name: 'limit', required: false, description: '取得件数制限' })
  @ApiResponse({ status: 200, description: '監査ログ取得成功' })
  async findByActor(
    @Query('actorId') actorId: string,
    @Query('limit') limit?: number,
  ) {
    return this.auditService.findByActor(actorId, limit);
  }

  @Get('logs/action/:action')
  @ApiOperation({ summary: 'アクション別監査ログ取得' })
  @ApiQuery({ name: 'limit', required: false, description: '取得件数制限' })
  @ApiResponse({ status: 200, description: '監査ログ取得成功' })
  async findByAction(
    @Query('action') action: AuditAction,
    @Query('limit') limit?: number,
  ) {
    return this.auditService.findByAction(action, limit);
  }

  @Get('logs/date-range')
  @ApiOperation({ summary: '期間別監査ログ取得' })
  @ApiQuery({ name: 'startDate', description: '開始日' })
  @ApiQuery({ name: 'endDate', description: '終了日' })
  @ApiQuery({ name: 'limit', required: false, description: '取得件数制限' })
  @ApiResponse({ status: 200, description: '監査ログ取得成功' })
  async findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('limit') limit?: number,
  ) {
    return this.auditService.findByDateRange(
      new Date(startDate),
      new Date(endDate),
      limit,
    );
  }

  @Get('summary')
  @ApiOperation({ summary: '監査ログサマリー取得' })
  @ApiQuery({ name: 'entity', required: false, description: 'エンティティ名' })
  @ApiQuery({ name: 'entityId', required: false, description: 'エンティティID' })
  @ApiResponse({ status: 200, description: 'サマリー取得成功' })
  async getAuditSummary(
    @Query('entity') entity?: string,
    @Query('entityId') entityId?: string,
  ) {
    return this.auditService.getAuditSummary(entity, entityId);
  }
}
