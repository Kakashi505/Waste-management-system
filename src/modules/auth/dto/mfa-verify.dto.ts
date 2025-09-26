import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class MfaVerifyDto {
  @ApiProperty({
    description: '6桁の認証コード',
    example: '123456',
  })
  @IsString()
  @Length(6, 6)
  token: string;
}
