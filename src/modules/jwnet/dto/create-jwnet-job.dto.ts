import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsUUID, IsObject } from 'class-validator';
import { JwnetJobType } from '../../../database/entities/jwnet-job.entity';

export class CreateJwnetJobDto {
  @ApiProperty({
    description: '案件ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  caseId: string;

  @ApiProperty({
    description: 'ジョブ種別',
    enum: JwnetJobType,
    example: JwnetJobType.REGISTER,
  })
  @IsEnum(JwnetJobType)
  jobType: JwnetJobType;

  @ApiProperty({
    description: 'ペイロードデータ',
    example: { manifestId: 'WM20240115001', wasteType: '一般廃棄物' },
  })
  @IsObject()
  payload: Record<string, any>;
}
