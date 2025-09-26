import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Case } from './case.entity';
import { Photo } from './photo.entity';
import { GpsEvent } from './gps-event.entity';
import { AuditLog } from './audit-log.entity';

export enum UserRole {
  WASTE_GENERATOR = '排出事業者',
  CONTRACTOR = '元請',
  CARRIER = '収集運搬',
  ADMIN = '管理者',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  passwordHash: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  companyName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  @Column({ default: false })
  mfaEnabled: boolean;

  @Column({ nullable: true })
  @Exclude()
  mfaSecret: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Case, (case_) => case_.createdBy)
  cases: Case[];

  @OneToMany(() => Photo, (photo) => photo.uploader)
  photos: Photo[];

  @OneToMany(() => GpsEvent, (gpsEvent) => gpsEvent.case_)
  gpsEvents: GpsEvent[];

  @OneToMany(() => AuditLog, (auditLog) => auditLog.actor)
  auditLogs: AuditLog[];
}
