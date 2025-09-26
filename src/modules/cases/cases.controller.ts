import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CasesService } from './cases.service';
import { MatchingService } from './matching.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { CaseStatus, CasePriority } from '../../database/entities/case.entity';

@ApiTags('cases')
@Controller('cases')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CasesController {
  constructor(
    private readonly casesService: CasesService,
    private readonly matchingService: MatchingService,
  ) {}

  @Post()
  @ApiOperation({ summary: '廃棄物依頼作成' })
  @ApiResponse({ status: 201, description: '依頼作成成功' })
  @ApiResponse({ status: 400, description: 'バリデーションエラー' })
  async create(@Body() createCaseDto: CreateCaseDto, @Request() req) {
    return this.casesService.create(createCaseDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: '廃棄物依頼一覧取得' })
  @ApiQuery({ name: 'status', required: false, enum: CaseStatus, description: 'ステータスでフィルタ' })
  @ApiQuery({ name: 'priority', required: false, enum: CasePriority, description: '優先度でフィルタ' })
  @ApiQuery({ name: 'wasteType', required: false, description: '廃棄物種別でフィルタ' })
  @ApiQuery({ name: 'dateFrom', required: false, description: '開始日でフィルタ' })
  @ApiQuery({ name: 'dateTo', required: false, description: '終了日でフィルタ' })
  @ApiResponse({ status: 200, description: '依頼一覧取得成功' })
  async findAll(
    @Request() req,
    @Query('status') status?: CaseStatus,
    @Query('priority') priority?: CasePriority,
    @Query('wasteType') wasteType?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const filters = {
      status,
      priority,
      wasteType,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    };
    return this.casesService.findAll(req.user, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: '廃棄物依頼詳細取得' })
  @ApiResponse({ status: 200, description: '依頼詳細取得成功' })
  @ApiResponse({ status: 404, description: '依頼が見つかりません' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.casesService.findOne(id, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: '廃棄物依頼更新' })
  @ApiResponse({ status: 200, description: '依頼更新成功' })
  @ApiResponse({ status: 404, description: '依頼が見つかりません' })
  async update(@Param('id') id: string, @Body() updateCaseDto: UpdateCaseDto, @Request() req) {
    return this.casesService.update(id, updateCaseDto, req.user);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'ステータス更新' })
  @ApiResponse({ status: 200, description: 'ステータス更新成功' })
  @ApiResponse({ status: 400, description: '無効なステータス遷移' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: CaseStatus,
    @Body('reason') reason: string,
    @Request() req,
  ) {
    return this.casesService.updateStatus(id, status, req.user, reason);
  }

  @Patch(':id/assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '業者割り当て' })
  @ApiResponse({ status: 200, description: '業者割り当て成功' })
  @ApiResponse({ status: 400, description: '割り当てできない状態' })
  async assignCarrier(
    @Param('id') id: string,
    @Body('carrierId') carrierId: string,
    @Request() req,
  ) {
    return this.casesService.assignCarrier(id, carrierId, req.user);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '依頼キャンセル' })
  @ApiResponse({ status: 200, description: 'キャンセル成功' })
  @ApiResponse({ status: 400, description: 'キャンセルできない状態' })
  async cancel(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req,
  ) {
    return this.casesService.cancel(id, req.user, reason);
  }

  @Get(':id/matching')
  @ApiOperation({ summary: 'マッチング結果取得' })
  @ApiResponse({ status: 200, description: 'マッチング結果取得成功' })
  async getMatchingResults(@Param('id') id: string) {
    return this.matchingService.findMatchingCarriers(id);
  }
}
