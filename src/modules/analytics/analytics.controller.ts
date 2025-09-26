import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@Controller('api/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get comprehensive dashboard metrics' })
  @ApiResponse({ status: 200, description: 'Dashboard metrics retrieved successfully' })
  async getDashboardMetrics() {
    return this.analyticsService.getDashboardMetrics();
  }

  @Get('predictive')
  @ApiOperation({ summary: 'Get AI-powered predictive analytics' })
  @ApiResponse({ status: 200, description: 'Predictive analytics retrieved successfully' })
  async getPredictiveAnalytics() {
    return this.analyticsService.getPredictiveAnalytics();
  }

  @Get('performance')
  @ApiOperation({ summary: 'Get performance insights and recommendations' })
  @ApiResponse({ status: 200, description: 'Performance insights retrieved successfully' })
  async getPerformanceInsights() {
    return this.analyticsService.getPerformanceInsights();
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get trend analysis data' })
  @ApiResponse({ status: 200, description: 'Trend data retrieved successfully' })
  async getTrends(@Query('period') period: string = '12months') {
    const metrics = await this.analyticsService.getDashboardMetrics();
    return {
      monthlyTrends: metrics.monthlyTrends,
      carrierPerformance: metrics.carrierPerformance,
      geographicDistribution: metrics.geographicDistribution,
    };
  }

  @Get('realtime')
  @ApiOperation({ summary: 'Get real-time system metrics' })
  @ApiResponse({ status: 200, description: 'Real-time metrics retrieved successfully' })
  async getRealTimeMetrics() {
    const metrics = await this.analyticsService.getDashboardMetrics();
    return metrics.realTimeMetrics;
  }
}
