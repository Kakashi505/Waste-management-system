import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { TenantUser } from './tenant-user.entity';
import { TenantSettings } from './tenant-settings.entity';

export enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
  EXPIRED = 'expired',
}

export enum TenantPlan {
  BASIC = 'basic',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
  CUSTOM = 'custom',
}

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  subdomain: string;

  @Column()
  displayName: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  contactEmail: string;

  @Column({ nullable: true })
  contactPhone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  website: string;

  @Column({
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.PENDING,
  })
  status: TenantStatus;

  @Column({
    type: 'enum',
    enum: TenantPlan,
    default: TenantPlan.BASIC,
  })
  plan: TenantPlan;

  @Column({ type: 'json', nullable: true })
  branding: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    customCss?: string;
  };

  @Column({ type: 'json', nullable: true })
  features: {
    maxUsers: number;
    maxCases: number;
    maxCarriers: number;
    storageLimit: number; // in GB
    apiRateLimit: number; // requests per minute
    customDomain: boolean;
    sso: boolean;
    advancedAnalytics: boolean;
    customReports: boolean;
    prioritySupport: boolean;
  };

  @Column({ type: 'timestamp', nullable: true })
  trialEndsAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  subscriptionEndsAt: Date;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => TenantUser, tenantUser => tenantUser.tenant)
  users: TenantUser[];

  @OneToMany(() => TenantSettings, settings => settings.tenant)
  settings: TenantSettings[];
}
