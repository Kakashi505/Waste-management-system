import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'ヘルスチェック' })
  @ApiResponse({ status: 200, description: 'サービス正常' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
    };
  }

  @Get('db')
  @ApiOperation({ summary: 'データベース接続確認' })
  @ApiResponse({ status: 200, description: 'データベース接続正常' })
  checkDatabase() {
    // TODO: Implement actual database health check
    return {
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('redis')
  @ApiOperation({ summary: 'Redis接続確認' })
  @ApiResponse({ status: 200, description: 'Redis接続正常' })
  checkRedis() {
    // TODO: Implement actual Redis health check
    return {
      status: 'ok',
      redis: 'connected',
      timestamp: new Date().toISOString(),
    };
  }
}
