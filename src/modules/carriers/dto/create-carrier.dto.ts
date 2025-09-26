import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, ValidateNested, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class PermitDto {
  @ApiProperty({
    description: '許可証番号',
    example: 'A123456789',
  })
  @IsString()
  permitNumber: string;

  @ApiProperty({
    description: '許可証種別',
    example: '一般廃棄物収集運搬業',
  })
  @IsString()
  permitType: string;

  @ApiProperty({
    description: '有効期間開始日',
    example: '2024-01-01',
  })
  @IsString()
  validFrom: string;

  @ApiProperty({
    description: '有効期間終了日',
    example: '2026-12-31',
  })
  @IsString()
  validTo: string;

  @ApiProperty({
    description: '対応廃棄物種別',
    example: ['一般廃棄物', '産業廃棄物'],
  })
  @IsArray()
  @IsString({ each: true })
  wasteTypes: string[];
}

export class ServiceAreaDto {
  @ApiProperty({
    description: 'サービスエリア種別',
    example: 'radius',
    enum: ['polygon', 'radius'],
  })
  @IsString()
  type: 'polygon' | 'radius';

  @ApiProperty({
    description: '座標データ（ポリゴンの場合は座標配列、半径の場合は中心点）',
    example: [[35.6762, 139.6503], [35.6862, 139.6603]],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  coordinates: number[][];

  @ApiProperty({
    description: '中心点（半径タイプの場合）',
    example: { lat: 35.6762, lng: 139.6503 },
    required: false,
  })
  @IsOptional()
  center?: {
    lat: number;
    lng: number;
  };

  @ApiProperty({
    description: '半径（メートル）',
    example: 10000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  radius?: number;
}

export class PriceMatrixDto {
  @ApiProperty({
    description: '廃棄物種別',
    example: '一般廃棄物',
  })
  @IsString()
  wasteType: string;

  @ApiProperty({
    description: '基本料金',
    example: 5000,
  })
  @IsNumber()
  basePrice: number;

  @ApiProperty({
    description: '単価',
    example: 50,
  })
  @IsNumber()
  pricePerUnit: number;

  @ApiProperty({
    description: '単位',
    example: 'kg',
    enum: ['kg', 'm3', 'truck'],
  })
  @IsString()
  unit: 'kg' | 'm3' | 'truck';

  @ApiProperty({
    description: '最低料金',
    example: 3000,
  })
  @IsNumber()
  minimumCharge: number;

  @ApiProperty({
    description: '追加料金',
    example: [{ name: '夜間料金', amount: 1000 }],
    required: false,
  })
  @IsOptional()
  @IsArray()
  additionalFees?: {
    name: string;
    amount: number;
  }[];
}

export class CreateCarrierDto {
  @ApiProperty({
    description: '業者名',
    example: '株式会社サンプル収集',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: '会社コード',
    example: 'CAR001',
  })
  @IsString()
  companyCode: string;

  @ApiProperty({
    description: '許可証情報',
    type: [PermitDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermitDto)
  permits: PermitDto[];

  @ApiProperty({
    description: 'サービスエリア',
    type: [ServiceAreaDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceAreaDto)
  serviceAreas: ServiceAreaDto[];

  @ApiProperty({
    description: '価格表',
    type: [PriceMatrixDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceMatrixDto)
  priceMatrix: PriceMatrixDto[];

  @ApiProperty({
    description: '信頼性スコア',
    example: 0.85,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  reliabilityScore?: number;

  @ApiProperty({
    description: '担当者名',
    example: '田中太郎',
    required: false,
  })
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @ApiProperty({
    description: '電話番号',
    example: '03-1234-5678',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'メールアドレス',
    example: 'contact@sample.co.jp',
    required: false,
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({
    description: '住所',
    example: '東京都渋谷区恵比寿1-1-1',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;
}
