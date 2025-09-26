import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from './tenant.entity';

export enum ApiKeyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  EXPIRED = 'expired',
}

export enum ApiKeyType {
  READ_ONLY = 'read_only',
  READ_WRITE = 'read_write',
  ADMIN = 'admin',
  WEBHOOK = 'webhook',
}

@Entity('api_keys')
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column({ unique: true })
  key: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ApiKeyStatus,
    default: ApiKeyStatus.ACTIVE,
  })
  status: ApiKeyStatus;

  @Column({
    type: 'enum',
    enum: ApiKeyType,
    default: ApiKeyType.READ_ONLY,
  })
  type: ApiKeyType;

  @Column({ type: 'json', nullable: true })
  permissions: {
    endpoints: string[];
    methods: string[];
    resources: string[];
  };

  @Column({ type: 'json', nullable: true })
  rateLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
    burstLimit: number;
  };

  @Column({ type: 'json', nullable: true })
  restrictions: {
    ipWhitelist: string[];
    ipBlacklist: string[];
    userAgentWhitelist: string[];
    refererWhitelist: string[];
  };

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt: Date;

  @Column({ default: 0 })
  usageCount: number;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;
}
