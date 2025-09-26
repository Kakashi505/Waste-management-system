import { PartialType } from '@nestjs/swagger';
import { CreateCaseDto } from './create-case.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { CaseStatus } from '../../../database/entities/case.entity';

export class UpdateCaseDto extends PartialType(CreateCaseDto) {
  @ApiProperty({
    description: 'ステータス',
    enum: CaseStatus,
    example: CaseStatus.MATCHING,
    required: false,
  })
  @IsOptional()
  @IsEnum(CaseStatus)
  status?: CaseStatus;
}
