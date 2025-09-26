import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsUUID, IsOptional } from 'class-validator';

export class CreateBidDto {
  @ApiProperty({
    description: '案件ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  caseId: string;

  @ApiProperty({
    description: '入札金額',
    example: 50000,
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'メッセージ',
    example: '迅速な対応を心がけます',
    required: false,
  })
  @IsOptional()
  @IsString()
  message?: string;
}
