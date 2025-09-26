import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwnetService } from './jwnet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateJwnetJobDto } from './dto/create-jwnet-job.dto';

@ApiTags('jwnet')
@Controller('jwnet')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class JwnetController {
  constructor(private readonly jwnetService: JwnetService) {}

  @Post('jobs')
  @ApiOperation({ summary: 'JWNETジョブ作成' })
  @ApiResponse({ status: 201, description: 'ジョブ作成成功' })
  @ApiResponse({ status: 400, description: 'バリデーションエラー' })
  async createJob(@Body() createJwnetJobDto: CreateJwnetJobDto) {
    return this.jwnetService.createJob(createJwnetJobDto);
  }

  @Get('jobs')
  @ApiOperation({ summary: 'JWNETジョブ一覧取得' })
  @ApiResponse({ status: 200, description: 'ジョブ一覧取得成功' })
  async findAll() {
    return this.jwnetService.findAll();
  }

  @Get('jobs/case/:caseId')
  @ApiOperation({ summary: '案件のJWNETジョブ一覧取得' })
  @ApiResponse({ status: 200, description: 'ジョブ一覧取得成功' })
  async findByCase(@Param('caseId') caseId: string) {
    return this.jwnetService.findByCase(caseId);
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'JWNETジョブ詳細取得' })
  @ApiResponse({ status: 200, description: 'ジョブ詳細取得成功' })
  @ApiResponse({ status: 404, description: 'ジョブが見つかりません' })
  async findOne(@Param('id') id: string) {
    return this.jwnetService.findOne(id);
  }

  @Post('jobs/:id/retry')
  @ApiOperation({ summary: 'JWNETジョブ再実行' })
  @ApiResponse({ status: 200, description: 'ジョブ再実行成功' })
  @ApiResponse({ status: 404, description: 'ジョブが見つかりません' })
  async retryJob(@Param('id') id: string) {
    return this.jwnetService.retryJob(id);
  }

  @Get('jobs/:id/status')
  @ApiOperation({ summary: 'JWNETジョブ状況取得' })
  @ApiResponse({ status: 200, description: '状況取得成功' })
  async getJobStatus(@Param('id') id: string) {
    return this.jwnetService.getJobStatus(id);
  }

  @Get('manifest/:caseId')
  @ApiOperation({ summary: 'マニフェストペイロード生成' })
  @ApiResponse({ status: 200, description: 'ペイロード生成成功' })
  async generateManifestPayload(@Param('caseId') caseId: string) {
    return this.jwnetService.generateManifestPayload(caseId);
  }

  @Post('process-pending')
  @ApiOperation({ summary: '保留中ジョブ処理' })
  @ApiResponse({ status: 200, description: '処理開始成功' })
  async processPendingJobs() {
    const processedCount = await this.jwnetService.processPendingJobs();
    return { 
      message: `${processedCount}件の保留中ジョブを処理開始しました`,
      processedCount,
    };
  }
}
