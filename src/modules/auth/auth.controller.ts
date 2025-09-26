import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService, LoginResponse } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { MfaSetupDto } from './dto/mfa-setup.dto';
import { MfaVerifyDto } from './dto/mfa-verify.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'ログイン' })
  @ApiResponse({ status: 200, description: 'ログイン成功' })
  @ApiResponse({ status: 401, description: '認証失敗' })
  async login(@Request() req, @Body() loginDto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(req.user);
  }

  @Post('register')
  @ApiOperation({ summary: 'ユーザー登録' })
  @ApiResponse({ status: 201, description: '登録成功' })
  @ApiResponse({ status: 400, description: 'バリデーションエラー' })
  @ApiResponse({ status: 409, description: 'メールアドレス重複' })
  async register(@Body() registerDto: RegisterDto): Promise<LoginResponse> {
    return this.authService.register(registerDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'プロフィール取得' })
  @ApiResponse({ status: 200, description: 'プロフィール取得成功' })
  async getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/setup')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'MFA設定開始' })
  @ApiResponse({ status: 200, description: 'MFA設定開始成功' })
  async setupMfa(@Request() req) {
    const secret = await this.authService.generateMfaSecret(req.user.id);
    return {
      secret,
      qrCodeUrl: `otpauth://totp/廃棄物管理システム:${req.user.email}?secret=${secret}&issuer=廃棄物管理システム`,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/enable')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'MFA有効化' })
  @ApiResponse({ status: 200, description: 'MFA有効化成功' })
  @ApiResponse({ status: 400, description: 'トークンが無効' })
  async enableMfa(@Request() req, @Body() mfaVerifyDto: MfaVerifyDto) {
    const success = await this.authService.enableMfa(req.user.id, mfaVerifyDto.token);
    return { success };
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/verify')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'MFA検証' })
  @ApiResponse({ status: 200, description: 'MFA検証成功' })
  @ApiResponse({ status: 400, description: 'トークンが無効' })
  async verifyMfa(@Request() req, @Body() mfaVerifyDto: MfaVerifyDto) {
    const isValid = await this.authService.verifyMfa(req.user.id, mfaVerifyDto.token);
    return { isValid };
  }
}
