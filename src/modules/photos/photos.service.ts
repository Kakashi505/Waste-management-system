import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Photo, PhotoTag, PhotoStatus, ValidationResult } from '../../database/entities/photo.entity';
import { Case } from '../../database/entities/case.entity';
import { User } from '../../database/entities/user.entity';
import { S3Service } from './s3.service';
import { ExifService } from './exif.service';
import { CreatePhotoDto } from './dto/create-photo.dto';

@Injectable()
export class PhotosService {
  constructor(
    @InjectRepository(Photo)
    private photoRepository: Repository<Photo>,
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    private s3Service: S3Service,
    private exifService: ExifService,
  ) {}

  async uploadPhoto(
    file: Express.Multer.File,
    createPhotoDto: CreatePhotoDto,
    uploader: User,
  ): Promise<Photo> {
    // Verify case exists and user has access
    const case_ = await this.caseRepository.findOne({
      where: { id: createPhotoDto.caseId },
    });

    if (!case_) {
      throw new NotFoundException('案件が見つかりません');
    }

    // Upload to S3
    const s3Key = await this.s3Service.uploadFile(file, createPhotoDto.caseId);

    // Extract EXIF data
    const exifData = await this.exifService.extractExifData(file.buffer);

    // Calculate file hash
    const hash = await this.calculateFileHash(file.buffer);

    // Validate photo
    const validationResult = await this.validatePhoto(
      exifData,
      case_.siteLat,
      case_.siteLng,
    );

    // Create photo record
    const photo = this.photoRepository.create({
      caseId: createPhotoDto.caseId,
      uploaderId: uploader.id,
      s3Key,
      s3Bucket: this.s3Service.getBucketName(),
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      exifLat: exifData.latitude,
      exifLng: exifData.longitude,
      exifTime: exifData.timestamp,
      accuracyM: exifData.accuracy,
      hash,
      tag: createPhotoDto.tag,
      status: validationResult.isValid ? PhotoStatus.VERIFIED : PhotoStatus.FLAGGED,
      validationResult,
    });

    return this.photoRepository.save(photo);
  }

  async findByCase(caseId: string, user: User): Promise<Photo[]> {
    // Verify user has access to this case
    const case_ = await this.caseRepository.findOne({
      where: { id: caseId },
    });

    if (!case_) {
      throw new NotFoundException('案件が見つかりません');
    }

    return this.photoRepository.find({
      where: { caseId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, user: User): Promise<Photo> {
    const photo = await this.photoRepository.findOne({
      where: { id },
      relations: ['case_', 'uploader'],
    });

    if (!photo) {
      throw new NotFoundException('写真が見つかりません');
    }

    // Verify user has access to this photo's case
    // TODO: Add proper access control

    return photo;
  }

  async getPresignedUrl(caseId: string, fileName: string, mimeType: string): Promise<string> {
    const case_ = await this.caseRepository.findOne({
      where: { id: caseId },
    });

    if (!case_) {
      throw new NotFoundException('案件が見つかりません');
    }

    const key = `photos/${caseId}/${Date.now()}-${fileName}`;
    return this.s3Service.getPresignedUploadUrl(key, mimeType);
  }

  async deletePhoto(id: string, user: User): Promise<void> {
    const photo = await this.findOne(id, user);

    // Delete from S3
    await this.s3Service.deleteFile(photo.s3Key);

    // Delete from database
    await this.photoRepository.remove(photo);
  }

  async validatePhoto(
    exifData: any,
    siteLat: number,
    siteLng: number,
    thresholdDistance: number = 100, // 100 meters
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    let isValid = true;

    // Check GPS coordinates
    if (!exifData.latitude || !exifData.longitude) {
      errors.push('GPS座標が取得できませんでした');
      isValid = false;
    } else {
      // Calculate distance from site
      const distance = this.calculateDistance(
        exifData.latitude,
        exifData.longitude,
        siteLat,
        siteLng,
      );

      if (distance > thresholdDistance) {
        errors.push(`現場から${Math.round(distance)}m離れています（閾値: ${thresholdDistance}m）`);
        isValid = false;
      }
    }

    // Check accuracy
    if (exifData.accuracy && exifData.accuracy > 50) {
      errors.push(`GPS精度が低いです（${exifData.accuracy}m）`);
      isValid = false;
    }

    // Check timestamp (should be recent)
    if (exifData.timestamp) {
      const photoTime = new Date(exifData.timestamp);
      const now = new Date();
      const timeDiff = Math.abs(now.getTime() - photoTime.getTime()) / (1000 * 60); // minutes

      if (timeDiff > 60) { // More than 1 hour old
        errors.push(`撮影時刻が古いです（${Math.round(timeDiff)}分前）`);
        isValid = false;
      }
    }

    return {
      isValid,
      distanceFromSite: exifData.latitude && exifData.longitude 
        ? this.calculateDistance(exifData.latitude, exifData.longitude, siteLat, siteLng)
        : null,
      accuracyThreshold: thresholdDistance,
      exifValid: !!(exifData.latitude && exifData.longitude),
      gpsValid: exifData.accuracy ? exifData.accuracy <= 50 : false,
      timestampValid: exifData.timestamp ? 
        Math.abs(new Date().getTime() - new Date(exifData.timestamp).getTime()) / (1000 * 60) <= 60
        : false,
      errors,
    };
  }

  private async calculateFileHash(buffer: Buffer): Promise<string> {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
