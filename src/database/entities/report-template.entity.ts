import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from './tenant.entity';

export enum ReportType {
  DASHBOARD = 'dashboard',
  ANALYTICS = 'analytics',
  FINANCIAL = 'financial',
  OPERATIONAL = 'operational',
  COMPLIANCE = 'compliance',
  CUSTOM = 'custom',
}

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
  JSON = 'json',
  HTML = 'html',
}

export enum ReportStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft',
}

@Entity('report_templates')
export class ReportTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ReportType,
    default: ReportType.CUSTOM,
  })
  type: ReportType;

  @Column({
    type: 'enum',
    enum: ReportFormat,
    default: ReportFormat.PDF,
  })
  format: ReportFormat;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.DRAFT,
  })
  status: ReportStatus;

  @Column({ type: 'json' })
  configuration: {
    dataSource: string;
    filters: Record<string, any>;
    aggregations: Record<string, any>;
    visualizations: Record<string, any>;
    layout: Record<string, any>;
    branding: Record<string, any>;
  };

  @Column({ type: 'json', nullable: true })
  parameters: {
    name: string;
    type: 'string' | 'number' | 'date' | 'boolean' | 'select';
    required: boolean;
    defaultValue?: any;
    options?: any[];
  }[];

  @Column({ type: 'json', nullable: true })
  permissions: {
    roles: string[];
    users: string[];
    public: boolean;
  };

  @Column({ default: false })
  isSystem: boolean;

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
