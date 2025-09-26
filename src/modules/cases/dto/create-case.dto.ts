import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsDateString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { CasePriority } from '../../../database/entities/case.entity';

export class CreateCaseDto {
  @ApiProperty({
    description: '現場緯度',
    example: 35.6762,
  })
  @IsNumber()
  siteLat: number;

  @ApiProperty({
    description: '現場経度',
    example: 139.6503,
  })
  @IsNumber()
  siteLng: number;

  @ApiProperty({
    description: '現場住所',
    example: '東京都渋谷区恵比寿1-1-1',
  })
  @IsString()
  siteAddress: string;

  @ApiProperty({
    description: '廃棄物種別',
    example: '一般廃棄物',
  })
  @IsString()
  wasteType: string;

  @ApiProperty({
    description: '廃棄物カテゴリ',
    example: '可燃ごみ',
  })
  @IsString()
  wasteCategory: string;

  @ApiProperty({
    description: '推定容量（m³）',
    example: 2.5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  estimatedVolume?: number;

  @ApiProperty({
    description: '推定重量（kg）',
    example: 1000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  estimatedWeight?: number;

  @ApiProperty({
    description: '予定日時',
    example: '2024-01-15T10:00:00Z',
  })
  @IsDateString()
  scheduledDate: string;

  @ApiProperty({
    description: '優先度',
    enum: CasePriority,
    example: CasePriority.NORMAL,
    required: false,
  })
  @IsOptional()
  @IsEnum(CasePriority)
  priority?: CasePriority;

  @ApiProperty({
    description: '特別要件',
    example: '午前中のみ対応可能',
    required: false,
  })
  @IsOptional()
  @IsString()
  specialRequirements?: string;

  @ApiProperty({
    description: '自動割り当て',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  autoAssign?: boolean;

  @ApiProperty({
    description: 'オークション有効',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  auctionEnabled?: boolean;

  @ApiProperty({
    description: 'オークション開始日時',
    example: '2024-01-10T09:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  auctionStartAt?: string;

  @ApiProperty({
    description: 'オークション終了日時',
    example: '2024-01-12T17:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  auctionEndAt?: string;
}
