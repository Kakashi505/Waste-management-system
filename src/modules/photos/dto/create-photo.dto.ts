import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsUUID } from 'class-validator';
import { PhotoTag } from '../../../database/entities/photo.entity';

export class CreatePhotoDto {
  @ApiProperty({
    description: '案件ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  caseId: string;

  @ApiProperty({
    description: '写真タグ',
    enum: PhotoTag,
    example: PhotoTag.WASTE_SITE,
  })
  @IsEnum(PhotoTag)
  tag: PhotoTag;
}
