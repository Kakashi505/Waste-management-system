import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import * as crypto from 'crypto';

@Injectable()
export class S3Service {
  private s3: AWS.S3;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.s3 = new AWS.S3({
      accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      region: this.configService.get<string>('AWS_REGION') || 'ap-northeast-1',
    });

    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET') || 'waste-management-photos';
  }

  async uploadFile(file: Express.Multer.File, caseId: string): Promise<string> {
    const key = `photos/${caseId}/${Date.now()}-${file.originalname}`;

    const uploadParams = {
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ServerSideEncryption: 'AES256',
      Metadata: {
        'case-id': caseId,
        'original-name': file.originalname,
        'upload-timestamp': new Date().toISOString(),
      },
    };

    await this.s3.upload(uploadParams).promise();
    return key;
  }

  async getPresignedUploadUrl(key: string, contentType: string): Promise<string> {
    const uploadParams = {
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
      ServerSideEncryption: 'AES256',
      Expires: 300, // 5 minutes
    };

    return this.s3.getSignedUrlPromise('putObject', uploadParams);
  }

  async getPresignedDownloadUrl(key: string): Promise<string> {
    const downloadParams = {
      Bucket: this.bucketName,
      Key: key,
      Expires: 3600, // 1 hour
    };

    return this.s3.getSignedUrlPromise('getObject', downloadParams);
  }

  async deleteFile(key: string): Promise<void> {
    const deleteParams = {
      Bucket: this.bucketName,
      Key: key,
    };

    await this.s3.deleteObject(deleteParams).promise();
  }

  async generateThumbnail(key: string): Promise<string> {
    // This would typically use AWS Lambda or a separate service
    // For now, return the original key
    return key;
  }

  getBucketName(): string {
    return this.bucketName;
  }

  async listFiles(prefix: string): Promise<string[]> {
    const listParams = {
      Bucket: this.bucketName,
      Prefix: prefix,
    };

    const result = await this.s3.listObjectsV2(listParams).promise();
    return result.Contents?.map(obj => obj.Key || '') || [];
  }
}
