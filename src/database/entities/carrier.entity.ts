import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Case } from './case.entity';
import { Bid } from './bid.entity';

export interface Permit {
  permitNumber: string;
  permitType: string;
  validFrom: Date;
  validTo: Date;
  wasteTypes: string[];
}

export interface ServiceArea {
  type: 'polygon' | 'radius';
  coordinates: number[][];
  center?: {
    lat: number;
    lng: number;
  };
  radius?: number; // in meters
}

export interface PriceMatrix {
  wasteType: string;
  basePrice: number;
  pricePerUnit: number;
  unit: 'kg' | 'm3' | 'truck';
  minimumCharge: number;
  additionalFees?: {
    name: string;
    amount: number;
  }[];
}

@Entity('carriers')
export class Carrier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  companyCode: string;

  @Column('jsonb')
  permits: Permit[];

  @Column('jsonb')
  serviceAreas: ServiceArea[];

  @Column('jsonb')
  priceMatrix: PriceMatrix[];

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.0 })
  reliabilityScore: number;

  @Column({ nullable: true })
  contactPerson: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Case, (case_) => case_.assignedCarrier)
  assignedCases: Case[];

  @OneToMany(() => Bid, (bid) => bid.carrier)
  bids: Bid[];
}
