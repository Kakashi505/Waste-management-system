import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from './tenant.entity';
import { User } from './user.entity';

export enum TenantUserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MANAGER = 'manager',
  OPERATOR = 'operator',
  VIEWER = 'viewer',
}

export enum TenantUserStatus {
  ACTIVE = 'active',
  INVITED = 'invited',
  SUSPENDED = 'suspended',
  REMOVED = 'removed',
}

@Entity('tenant_users')
export class TenantUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: TenantUserRole,
    default: TenantUserRole.VIEWER,
  })
  role: TenantUserRole;

  @Column({
    type: 'enum',
    enum: TenantUserStatus,
    default: TenantUserStatus.INVITED,
  })
  status: TenantUserStatus;

  @Column({ type: 'json', nullable: true })
  permissions: {
    canCreateCases: boolean;
    canEditCases: boolean;
    canDeleteCases: boolean;
    canManageCarriers: boolean;
    canViewAnalytics: boolean;
    canManageUsers: boolean;
    canAccessReports: boolean;
    canManageSettings: boolean;
  };

  @Column({ type: 'timestamp', nullable: true })
  invitedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  joinedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastActiveAt: Date;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Tenant, tenant => tenant.users)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
