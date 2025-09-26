import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GpsService } from './gps.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateGpsEventDto } from './dto/create-gps-event.dto';

@ApiTags('gps')
@Controller('gps')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GpsController {
  constructor(private readonly gpsService: GpsService) {}

  @Post('events')
  @ApiOperation({ summary: 'GPSイベント登録' })
  @ApiResponse({ status: 201, description: 'イベント登録成功' })
  @ApiResponse({ status: 400, description: 'バリデーションエラー' })
  async createEvent(@Body() createGpsEventDto: CreateGpsEventDto) {
    return this.gpsService.createEvent(createGpsEventDto);
  }

  @Get('events/case/:caseId')
  @ApiOperation({ summary: '案件のGPSイベント一覧取得' })
  @ApiResponse({ status: 200, description: 'イベント一覧取得成功' })
  async findByCase(@Param('caseId') caseId: string) {
    return this.gpsService.findByCase(caseId);
  }

  @Get('events/device/:deviceId')
  @ApiOperation({ summary: 'デバイスのGPSイベント一覧取得' })
  @ApiQuery({ name: 'limit', required: false, description: '取得件数制限' })
  @ApiResponse({ status: 200, description: 'イベント一覧取得成功' })
  async findByDevice(
    @Param('deviceId') deviceId: string,
    @Query('limit') limit?: number,
  ) {
    return this.gpsService.findByDevice(deviceId, limit);
  }

  @Get('summary/case/:caseId')
  @ApiOperation({ summary: '案件のGPSイベントサマリー取得' })
  @ApiResponse({ status: 200, description: 'サマリー取得成功' })
  async getEventSummary(@Param('caseId') caseId: string) {
    return this.gpsService.getEventSummary(caseId);
  }

  @Post('validate')
  @ApiOperation({ summary: '位置情報検証' })
  @ApiResponse({ status: 200, description: '検証結果取得成功' })
  async validateLocation(
    @Body('lat') lat: number,
    @Body('lng') lng: number,
    @Body('caseLat') caseLat: number,
    @Body('caseLng') caseLng: number,
    @Body('thresholdDistance') thresholdDistance?: number,
  ) {
    return this.gpsService.validateLocation(lat, lng, caseLat, caseLng, thresholdDistance);
  }
}
