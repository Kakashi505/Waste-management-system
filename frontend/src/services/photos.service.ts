import apiClient from './api';

export interface Photo {
  id: string;
  caseId: string;
  fileName: string;
  s3Key: string;
  s3Bucket: string;
  fileSize: number;
  mimeType: string;
  exifLat?: number;
  exifLng?: number;
  exifTime?: string;
  accuracyM?: number;
  hash: string;
  tag: '排出現場' | '積込' | '処分場' | 'その他';
  status: 'アップロード済み' | '検証済み' | 'フラグ付き' | 'エラー';
  validationResult?: {
    isValid: boolean;
    distanceFromSite: number;
    accuracyThreshold: number;
    exifValid: boolean;
    gpsValid: boolean;
    timestampValid: boolean;
    errors: string[];
  };
  createdAt: string;
}

export interface CreatePhotoRequest {
  caseId: string;
  tag: '排出現場' | '積込' | '処分場' | 'その他';
}

export interface PresignedUrlRequest {
  caseId: string;
  fileName: string;
  mimeType: string;
}

export interface PresignedUrlResponse {
  url: string;
}

class PhotosService {
  async getPhotosByCase(caseId: string): Promise<Photo[]> {
    const response = await apiClient.get(`/photos/case/${caseId}`);
    return response.data;
  }

  async getPhoto(id: string): Promise<Photo> {
    const response = await apiClient.get(`/photos/${id}`);
    return response.data;
  }

  async uploadPhoto(file: File, photoData: CreatePhotoRequest): Promise<Photo> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('caseId', photoData.caseId);
    formData.append('tag', photoData.tag);

    const response = await apiClient.post('/photos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getPresignedUrl(request: PresignedUrlRequest): Promise<PresignedUrlResponse> {
    const response = await apiClient.post('/photos/presigned-url', request);
    return response.data;
  }

  async deletePhoto(id: string): Promise<void> {
    await apiClient.delete(`/photos/${id}`);
  }

  async getPhotoUrl(s3Key: string): Promise<string> {
    // S3から直接URLを取得する場合の実装
    // 実際の実装では、バックエンドからプリサインドURLを取得
    const response = await apiClient.get(`/photos/url/${s3Key}`);
    return response.data.url;
  }
}

export const photosService = new PhotosService();
