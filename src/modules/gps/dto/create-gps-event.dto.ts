import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { GpsEventType } from '../../../database/entities/gps-event.entity';

export class CreateGpsEventDto {
  @ApiProperty({
    description: '案件ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  caseId: string;

  @ApiProperty({
    description: 'デバイスID',
    example: 'DEVICE_001',
  })
  @IsString()
  deviceId: string;

  @ApiProperty({
    description: '緯度',
    example: 35.6762,
  })
  @IsNumber()
  lat: number;

  @ApiProperty({
    description: '経度',
    example: 139.6503,
  })
  @IsNumber()
  lng: number;

  @ApiProperty({
    description: '精度（メートル）',
    example: 5.0,
  })
  @IsNumber()
  accuracyM: number;

  @ApiProperty({
    description: '高度（メートル）',
    example: 10.5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  altitude?: number;

  @ApiProperty({
    description: '速度（m/s）',
    example: 15.5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  speed?: number;

  @ApiProperty({
    description: '方向（度）',
    example: 180.0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  heading?: number;

  @ApiProperty({
    description: 'イベント種別',
    enum: GpsEventType,
    example: GpsEventType.SITE_ARRIVAL,
  })
  @IsEnum(GpsEventType)
  eventType: GpsEventType;

  @ApiProperty({
    description: '閾値距離（メートル）',
    example: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  thresholdDistanceM?: number;
}
