import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../../database/entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'ユーザー一覧取得' })
  @ApiQuery({ name: 'role', required: false, enum: UserRole, description: 'ユーザー役割でフィルタ' })
  @ApiResponse({ status: 200, description: 'ユーザー一覧取得成功' })
  async findAll(@Query('role') role?: UserRole) {
    return this.usersService.findAll(role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'ユーザー詳細取得' })
  @ApiResponse({ status: 200, description: 'ユーザー詳細取得成功' })
  @ApiResponse({ status: 404, description: 'ユーザーが見つかりません' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'ユーザー情報更新' })
  @ApiResponse({ status: 200, description: 'ユーザー情報更新成功' })
  @ApiResponse({ status: 404, description: 'ユーザーが見つかりません' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ユーザー無効化' })
  @ApiResponse({ status: 200, description: 'ユーザー無効化成功' })
  @ApiResponse({ status: 404, description: 'ユーザーが見つかりません' })
  async remove(@Param('id') id: string) {
    await this.usersService.deactivate(id);
    return { message: 'ユーザーが無効化されました' };
  }
}
