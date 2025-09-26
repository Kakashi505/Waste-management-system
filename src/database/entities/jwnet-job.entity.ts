import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Case } from './case.entity';

export enum JwnetJobType {
  REGISTER = '登録',
  UPDATE = '更新',
  TRANSFER_CONFIRM = '受渡確認',
  COMPLETION_REPORT = '完了報告',
}

export enum JwnetJobStatus {
  PENDING = '待機中',
  PROCESSING = '処理中',
  COMPLETED = '完了',
  ERROR = 'エラー',
  RETRY = 'リトライ',
}

@Entity('jwnet_jobs')
export class JwnetJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  caseId: string;

  @ManyToOne(() => Case, (case_) => case_.jwnetJobs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'caseId' })
  case_: Case;

  @Column({
    type: 'enum',
    enum: JwnetJobType,
  })
  jobType: JwnetJobType;

  @Column('jsonb')
  payload: Record<string, any>;

  @Column({
    type: 'enum',
    enum: JwnetJobStatus,
    default: JwnetJobStatus.PENDING,
  })
  status: JwnetJobStatus;

  @Column({ length: 100, nullable: true })
  externalId: string;

  @Column('jsonb', { nullable: true })
  externalResponse: Record<string, any>;

  @Column({ default: 0 })
  attempts: number;

  @Column({ default: 3 })
  maxAttempts: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastAttemptAt: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  nextRetryAt: Date;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
