import { Injectable } from '@nestjs/common';
import * as EXIF from 'exif-js';

export interface ExifData {
  latitude?: number;
  longitude?: number;
  timestamp?: Date;
  accuracy?: number;
  altitude?: number;
  direction?: number;
  make?: string;
  model?: string;
  software?: string;
}

@Injectable()
export class ExifService {
  async extractExifData(buffer: Buffer): Promise<ExifData> {
    return new Promise((resolve, reject) => {
      try {
        const exifData = EXIF.readFromBinaryFile(buffer);
        
        if (!exifData) {
          resolve({});
          return;
        }

        const result: ExifData = {};

        // Extract GPS data
        if (exifData.GPSLatitude && exifData.GPSLongitude) {
          result.latitude = this.convertDMSToDD(
            exifData.GPSLatitude[0],
            exifData.GPSLatitude[1],
            exifData.GPSLatitude[2],
            exifData.GPSLatitudeRef
          );
          
          result.longitude = this.convertDMSToDD(
            exifData.GPSLongitude[0],
            exifData.GPSLongitude[1],
            exifData.GPSLongitude[2],
            exifData.GPSLongitudeRef
          );
        }

        // Extract timestamp
        if (exifData.DateTimeOriginal) {
          result.timestamp = new Date(exifData.DateTimeOriginal);
        } else if (exifData.DateTime) {
          result.timestamp = new Date(exifData.DateTime);
        }

        // Extract altitude
        if (exifData.GPSAltitude) {
          result.altitude = exifData.GPSAltitude;
        }

        // Extract direction
        if (exifData.GPSImgDirection) {
          result.direction = exifData.GPSImgDirection;
        }

        // Extract accuracy (if available in GPS data)
        if (exifData.GPSHPositioningError) {
          result.accuracy = exifData.GPSHPositioningError;
        }

        // Extract camera info
        if (exifData.Make) {
          result.make = exifData.Make;
        }
        if (exifData.Model) {
          result.model = exifData.Model;
        }
        if (exifData.Software) {
          result.software = exifData.Software;
        }

        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  private convertDMSToDD(degrees: number, minutes: number, seconds: number, ref: string): number {
    let dd = degrees + minutes / 60 + seconds / 3600;
    if (ref === 'S' || ref === 'W') {
      dd = dd * -1;
    }
    return dd;
  }

  async validateExifData(exifData: ExifData): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Check if GPS data exists
    if (!exifData.latitude || !exifData.longitude) {
      errors.push('GPS座標が含まれていません');
    }

    // Check if timestamp exists
    if (!exifData.timestamp) {
      errors.push('撮影時刻が含まれていません');
    }

    // Check if timestamp is reasonable (not too old or in the future)
    if (exifData.timestamp) {
      const now = new Date();
      const photoTime = new Date(exifData.timestamp);
      const timeDiff = Math.abs(now.getTime() - photoTime.getTime()) / (1000 * 60 * 60); // hours

      if (timeDiff > 24) { // More than 24 hours old
        errors.push('撮影時刻が古すぎます');
      }

      if (photoTime > now) {
        errors.push('撮影時刻が未来になっています');
      }
    }

    // Check accuracy if available
    if (exifData.accuracy && exifData.accuracy > 100) {
      errors.push('GPS精度が低すぎます');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
