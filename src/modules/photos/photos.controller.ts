import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { PhotosService } from './photos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePhotoDto } from './dto/create-photo.dto';

@ApiTags('photos')
@Controller('photos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '写真アップロード' })
  @ApiResponse({ status: 201, description: 'アップロード成功' })
  @ApiResponse({ status: 400, description: 'バリデーションエラー' })
  async uploadPhoto(
    @UploadedFile() file: Express.Multer.File,
    @Body() createPhotoDto: CreatePhotoDto,
    @Request() req,
  ) {
    return this.photosService.uploadPhoto(file, createPhotoDto, req.user);
  }

  @Post('presigned-url')
  @ApiOperation({ summary: 'プリサインドURL取得' })
  @ApiResponse({ status: 200, description: 'プリサインドURL取得成功' })
  async getPresignedUrl(
    @Body('caseId') caseId: string,
    @Body('fileName') fileName: string,
    @Body('mimeType') mimeType: string,
  ) {
    const url = await this.photosService.getPresignedUrl(caseId, fileName, mimeType);
    return { url };
  }

  @Get('case/:caseId')
  @ApiOperation({ summary: '案件の写真一覧取得' })
  @ApiResponse({ status: 200, description: '写真一覧取得成功' })
  async findByCase(@Param('caseId') caseId: string, @Request() req) {
    return this.photosService.findByCase(caseId, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: '写真詳細取得' })
  @ApiResponse({ status: 200, description: '写真詳細取得成功' })
  @ApiResponse({ status: 404, description: '写真が見つかりません' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.photosService.findOne(id, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: '写真削除' })
  @ApiResponse({ status: 200, description: '写真削除成功' })
  @ApiResponse({ status: 404, description: '写真が見つかりません' })
  async deletePhoto(@Param('id') id: string, @Request() req) {
    await this.photosService.deletePhoto(id, req.user);
    return { message: '写真が削除されました' };
  }
}
