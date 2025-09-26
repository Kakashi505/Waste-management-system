import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CarriersService } from './carriers.service';
import { CreateCarrierDto } from './dto/create-carrier.dto';
import { UpdateCarrierDto } from './dto/update-carrier.dto';

@ApiTags('carriers')
@Controller('carriers')
export class CarriersController {
  constructor(private readonly carriersService: CarriersService) {}

  @Post()
  @ApiOperation({ summary: '収集運搬業者登録' })
  @ApiResponse({ status: 201, description: '業者登録成功' })
  @ApiResponse({ status: 400, description: 'バリデーションエラー' })
  async create(@Body() createCarrierDto: CreateCarrierDto) {
    return this.carriersService.create(createCarrierDto);
  }

  @Get()
  @ApiOperation({ summary: '収集運搬業者一覧取得' })
  @ApiResponse({ status: 200, description: '業者一覧取得成功' })
  async findAll() {
    return this.carriersService.findAll();
  }

  @Get('search')
  @ApiOperation({ summary: '業者検索' })
  @ApiQuery({ name: 'wasteType', required: false, description: '廃棄物種別で検索' })
  @ApiQuery({ name: 'lat', required: false, description: '緯度' })
  @ApiQuery({ name: 'lng', required: false, description: '経度' })
  @ApiResponse({ status: 200, description: '検索結果取得成功' })
  async search(
    @Query('wasteType') wasteType?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
  ) {
    if (wasteType) {
      return this.carriersService.findByWasteType(wasteType);
    }
    
    if (lat && lng) {
      return this.carriersService.findByLocation(parseFloat(lat), parseFloat(lng));
    }

    return this.carriersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '収集運搬業者詳細取得' })
  @ApiResponse({ status: 200, description: '業者詳細取得成功' })
  @ApiResponse({ status: 404, description: '業者が見つかりません' })
  async findOne(@Param('id') id: string) {
    return this.carriersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '収集運搬業者情報更新' })
  @ApiResponse({ status: 200, description: '業者情報更新成功' })
  @ApiResponse({ status: 404, description: '業者が見つかりません' })
  async update(@Param('id') id: string, @Body() updateCarrierDto: UpdateCarrierDto) {
    return this.carriersService.update(id, updateCarrierDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '収集運搬業者削除' })
  @ApiResponse({ status: 200, description: '業者削除成功' })
  @ApiResponse({ status: 404, description: '業者が見つかりません' })
  async remove(@Param('id') id: string) {
    await this.carriersService.remove(id);
    return { message: '収集運搬業者が削除されました' };
  }
}
