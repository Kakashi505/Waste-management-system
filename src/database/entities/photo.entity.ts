import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Case } from './case.entity';
import { User } from './user.entity';

export enum PhotoTag {
  WASTE_SITE = '排出現場',
  LOADING = '積込',
  DISPOSAL_SITE = '処分場',
  OTHER = 'その他',
}

export enum PhotoStatus {
  UPLOADED = 'アップロード済み',
  VERIFIED = '検証済み',
  FLAGGED = 'フラグ付き',
  ERROR = 'エラー',
}

export interface ValidationResult {
  isValid: boolean;
  distanceFromSite: number;
  accuracyThreshold: number;
  exifValid: boolean;
  gpsValid: boolean;
  timestampValid: boolean;
  errors: string[];
}

@Entity('photos')
export class Photo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  caseId: string;

  @ManyToOne(() => Case, (case_) => case_.photos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'caseId' })
  case_: Case;

  @Column()
  uploaderId: string;

  @ManyToOne(() => User, (user) => user.photos)
  @JoinColumn({ name: 'uploaderId' })
  uploader: User;

  @Column({ length: 500 })
  s3Key: string;

  @Column({ length: 100 })
  s3Bucket: string;

  @Column()
  fileName: string;

  @Column({ type: 'bigint' })
  fileSize: number;

  @Column({ length: 100 })
  mimeType: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  exifLat: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  exifLng: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  exifTime: Date;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  accuracyM: number;

  @Column({ length: 64 })
  hash: string;

  @Column({
    type: 'enum',
    enum: PhotoTag,
  })
  tag: PhotoTag;

  @Column({
    type: 'enum',
    enum: PhotoStatus,
    default: PhotoStatus.UPLOADED,
  })
  status: PhotoStatus;

  @Column('jsonb', { nullable: true })
  validationResult: ValidationResult;

  @CreateDateColumn()
  createdAt: Date;
}
