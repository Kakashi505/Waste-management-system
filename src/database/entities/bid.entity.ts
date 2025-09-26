import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Case } from './case.entity';
import { Carrier } from './carrier.entity';

export enum BidStatus {
  SUBMITTED = '提出済み',
  AWARDED = '受注',
  WON = '落札',
  CANCELLED = 'キャンセル',
}

@Entity('bids')
@Unique(['caseId', 'carrierId'])
export class Bid {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  caseId: string;

  @ManyToOne(() => Case, (case_) => case_.bids, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'caseId' })
  case_: Case;

  @Column()
  carrierId: string;

  @ManyToOne(() => Carrier, (carrier) => carrier.bids)
  @JoinColumn({ name: 'carrierId' })
  carrier: Carrier;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({
    type: 'enum',
    enum: BidStatus,
    default: BidStatus.SUBMITTED,
  })
  status: BidStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
