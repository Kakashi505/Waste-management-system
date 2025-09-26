import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Photo } from '../../database/entities/photo.entity';
import { Case } from '../../database/entities/case.entity';
import { PhotosService } from './photos.service';
import { PhotosController } from './photos.controller';
import { S3Service } from './s3.service';
import { ExifService } from './exif.service';

@Module({
  imports: [TypeOrmModule.forFeature([Photo, Case])],
  providers: [PhotosService, S3Service, ExifService],
  controllers: [PhotosController],
  exports: [PhotosService, S3Service],
})
export class PhotosModule {}
