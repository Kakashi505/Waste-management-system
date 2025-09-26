import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Carrier } from './carrier.entity';
import { Bid } from './bid.entity';
import { Photo } from './photo.entity';
import { GpsEvent } from './gps-event.entity';
import { JwnetJob } from './jwnet-job.entity';

export enum CaseStatus {
  NEW = '新規',
  MATCHING = 'マッチング中',
  ASSIGNED = '業者選定済み',
  COLLECTED = '収集完了',
  DISPOSED = '処分完了',
  CANCELLED = 'キャンセル',
}

export enum CasePriority {
  URGENT = '緊急',
  HIGH = '高',
  NORMAL = '通常',
  LOW = '低',
}

@Entity('cases')
export class Case {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  caseNumber: string;

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  siteLat: number;

  @Column({ type: 'decimal', precision: 11, scale: 8 })
  siteLng: number;

  @Column({ type: 'text' })
  siteAddress: string;

  @Column()
  wasteType: string;

  @Column()
  wasteCategory: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedVolume: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedWeight: number;

  @Column({ type: 'timestamp with time zone' })
  scheduledDate: Date;

  @Column({
    type: 'enum',
    enum: CaseStatus,
    default: CaseStatus.NEW,
  })
  status: CaseStatus;

  @Column({
    type: 'enum',
    enum: CasePriority,
    default: CasePriority.NORMAL,
  })
  priority: CasePriority;

  @Column({ type: 'text', nullable: true })
  specialRequirements: string;

  @Column()
  createdById: string;

  @ManyToOne(() => User, (user) => user.cases)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ nullable: true })
  assignedCarrierId: string;

  @ManyToOne(() => Carrier, (carrier) => carrier.assignedCases)
  @JoinColumn({ name: 'assignedCarrierId' })
  assignedCarrier: Carrier;

  @Column({ default: false })
  autoAssign: boolean;

  @Column({ default: false })
  auctionEnabled: boolean;

  @Column({ type: 'timestamp with time zone', nullable: true })
  auctionStartAt: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  auctionEndAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Bid, (bid) => bid.case_)
  bids: Bid[];

  @OneToMany(() => Photo, (photo) => photo.case_)
  photos: Photo[];

  @OneToMany(() => GpsEvent, (gpsEvent) => gpsEvent.case_)
  gpsEvents: GpsEvent[];

  @OneToMany(() => JwnetJob, (jwnetJob) => jwnetJob.case_)
  jwnetJobs: JwnetJob[];
}
