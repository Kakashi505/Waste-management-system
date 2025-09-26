import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../../../database/entities/user.entity';

export class RegisterDto {
  @ApiProperty({
    description: 'メールアドレス',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'パスワード',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: '氏名',
    example: '田中太郎',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: '会社名',
    example: '株式会社サンプル',
    required: false,
  })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({
    description: 'ユーザー役割',
    enum: UserRole,
    example: UserRole.WASTE_GENERATOR,
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    description: '電話番号',
    example: '03-1234-5678',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: '住所',
    example: '東京都渋谷区...',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;
}
