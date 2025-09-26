import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'ダッシュボード統計取得' })
  @ApiResponse({ status: 200, description: '統計取得成功' })
  async getDashboardStats() {
    return this.reportsService.getDashboardStats();
  }

  @Get('case-status')
  @ApiOperation({ summary: '案件ステータス統計取得' })
  @ApiResponse({ status: 200, description: '統計取得成功' })
  async getCaseStatusStats() {
    return this.reportsService.getCaseStatusStats();
  }

  @Get('monthly')
  @ApiOperation({ summary: '月次統計取得' })
  @ApiQuery({ name: 'year', required: false, description: '年（デフォルト: 現在年）' })
  @ApiResponse({ status: 200, description: '統計取得成功' })
  async getMonthlyStats(@Query('year') year?: number) {
    const targetYear = year || new Date().getFullYear();
    return this.reportsService.getMonthlyStats(targetYear);
  }

  @Get('carrier-performance')
  @ApiOperation({ summary: '業者パフォーマンス統計取得' })
  @ApiResponse({ status: 200, description: '統計取得成功' })
  async getCarrierPerformance() {
    return this.reportsService.getCarrierPerformance();
  }

  @Get('waste-type')
  @ApiOperation({ summary: '廃棄物種別統計取得' })
  @ApiResponse({ status: 200, description: '統計取得成功' })
  async getWasteTypeStats() {
    return this.reportsService.getWasteTypeStats();
  }

  @Get('recent-activity')
  @ApiOperation({ summary: '最近のアクティビティ取得' })
  @ApiQuery({ name: 'limit', required: false, description: '取得件数（デフォルト: 10）' })
  @ApiResponse({ status: 200, description: 'アクティビティ取得成功' })
  async getRecentActivity(@Query('limit') limit?: number) {
    return this.reportsService.getRecentActivity(limit);
  }
}
