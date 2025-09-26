import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Case } from './case.entity';

export enum GpsEventType {
  SITE_ARRIVAL = '現場到着',
  LOADING_START = '積込開始',
  LOADING_COMPLETE = '積込完了',
  DISPOSAL_ARRIVAL = '処分場到着',
  DISPOSAL_COMPLETE = '処分完了',
  OTHER = 'その他',
}

export enum GpsEventStatus {
  OK = 'OK',
  NG = 'NG',
  NEEDS_REVIEW = '要確認',
}

@Entity('gps_events')
export class GpsEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  caseId: string;

  @ManyToOne(() => Case, (case_) => case_.gpsEvents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'caseId' })
  case_: Case;

  @Column({ length: 100 })
  deviceId: string;

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  lat: number;

  @Column({ type: 'decimal', precision: 11, scale: 8 })
  lng: number;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  accuracyM: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  altitude: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  speed: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  heading: number;

  @Column({ type: 'timestamp with time zone' })
  timestamp: Date;

  @Column({
    type: 'enum',
    enum: GpsEventType,
  })
  eventType: GpsEventType;

  @Column({
    type: 'enum',
    enum: GpsEventStatus,
    default: GpsEventStatus.OK,
  })
  status: GpsEventStatus;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  thresholdDistanceM: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  distanceFromSiteM: number;

  @CreateDateColumn()
  createdAt: Date;
}
