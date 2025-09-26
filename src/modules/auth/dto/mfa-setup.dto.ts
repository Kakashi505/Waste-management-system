import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class MfaSetupDto {
  @ApiProperty({
    description: 'MFA設定用のシークレット',
    example: 'JBSWY3DPEHPK3PXP',
  })
  @IsString()
  @Length(16, 32)
  secret: string;
}
