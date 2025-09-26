import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { User } from '../../database/entities/user.entity';
import { Tenant } from '../../database/entities/tenant.entity';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

export interface SecurityEvent {
  type: 'login' | 'logout' | 'failed_login' | 'password_change' | 'permission_change' | 'data_access' | 'data_modification' | 'system_event';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  metadata: Record<string, any>;
}

export interface SecurityPolicy {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    maxAge: number; // days
    preventReuse: number; // number of previous passwords
  };
  sessionPolicy: {
    timeout: number; // minutes
    maxConcurrent: number;
    requireReauth: boolean;
  };
  accessPolicy: {
    ipWhitelist: string[];
    ipBlacklist: string[];
    geoRestrictions: string[];
    timeRestrictions: {
      start: string;
      end: string;
      timezone: string;
    }[];
  };
  auditPolicy: {
    logAllActions: boolean;
    logDataAccess: boolean;
    logDataModification: boolean;
    retentionPeriod: number; // days
  };
}

@Injectable()
export class SecurityService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
  ) {}

  async logSecurityEvent(
    userId: string,
    tenantId: string,
    event: SecurityEvent,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const auditLog = this.auditLogRepository.create({
      userId,
      tenantId,
      action: event.type,
      resource: 'security',
      details: {
        ...event,
        ipAddress,
        userAgent,
        timestamp: new Date().toISOString(),
      },
      severity: event.severity,
    });

    await this.auditLogRepository.save(auditLog);

    // Alert on critical events
    if (event.severity === 'critical') {
      await this.sendSecurityAlert(userId, tenantId, event);
    }
  }

  async validatePassword(password: string, policy: SecurityPolicy['passwordPolicy']): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (password.length < policy.minLength) {
      errors.push(`パスワードは最低${policy.minLength}文字以上である必要があります`);
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('パスワードには大文字を含める必要があります');
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('パスワードには小文字を含める必要があります');
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      errors.push('パスワードには数字を含める必要があります');
    }

    if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('パスワードには特殊文字を含める必要があります');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async generateSecureToken(length: number = 32): Promise<string> {
    return crypto.randomBytes(length).toString('hex');
  }

  async encryptSensitiveData(data: string, key: string): Promise<string> {
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  async decryptSensitiveData(encryptedData: string, key: string): Promise<string> {
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async checkAccessPolicy(
    userId: string,
    tenantId: string,
    ipAddress: string,
    policy: SecurityPolicy['accessPolicy']
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Check IP whitelist
    if (policy.ipWhitelist.length > 0) {
      const isWhitelisted = policy.ipWhitelist.some(ip => 
        ip === ipAddress || this.isIpInRange(ipAddress, ip)
      );
      if (!isWhitelisted) {
        return { allowed: false, reason: 'IPアドレスがホワイトリストにありません' };
      }
    }

    // Check IP blacklist
    if (policy.ipBlacklist.length > 0) {
      const isBlacklisted = policy.ipBlacklist.some(ip => 
        ip === ipAddress || this.isIpInRange(ipAddress, ip)
      );
      if (isBlacklisted) {
        return { allowed: false, reason: 'IPアドレスがブラックリストにあります' };
      }
    }

    // Check time restrictions
    if (policy.timeRestrictions.length > 0) {
      const now = new Date();
      const isAllowedTime = policy.timeRestrictions.some(restriction => {
        const start = new Date(`${now.toDateString()} ${restriction.start}`);
        const end = new Date(`${now.toDateString()} ${restriction.end}`);
        return now >= start && now <= end;
      });

      if (!isAllowedTime) {
        return { allowed: false, reason: 'アクセス時間外です' };
      }
    }

    return { allowed: true };
  }

  async detectAnomalousActivity(userId: string, tenantId: string): Promise<{
    isAnomalous: boolean;
    riskScore: number;
    factors: string[];
  }> {
    const recentLogs = await this.auditLogRepository.find({
      where: { userId, tenantId },
      order: { createdAt: 'DESC' },
      take: 100,
    });

    let riskScore = 0;
    const factors: string[] = [];

    // Check for multiple failed logins
    const failedLogins = recentLogs.filter(log => 
      log.action === 'failed_login' && 
      new Date(log.createdAt).getTime() > Date.now() - 3600000 // Last hour
    );

    if (failedLogins.length > 5) {
      riskScore += 30;
      factors.push('複数のログイン失敗');
    }

    // Check for unusual access patterns
    const uniqueIps = new Set(recentLogs.map(log => log.details?.ipAddress).filter(Boolean));
    if (uniqueIps.size > 3) {
      riskScore += 20;
      factors.push('複数のIPアドレスからのアクセス');
    }

    // Check for rapid successive actions
    const rapidActions = recentLogs.filter((log, index) => {
      if (index === 0) return false;
      const prevLog = recentLogs[index - 1];
      const timeDiff = new Date(log.createdAt).getTime() - new Date(prevLog.createdAt).getTime();
      return timeDiff < 1000; // Less than 1 second
    });

    if (rapidActions.length > 10) {
      riskScore += 25;
      factors.push('異常に高速な操作');
    }

    // Check for off-hours access
    const offHoursAccess = recentLogs.filter(log => {
      const hour = new Date(log.createdAt).getHours();
      return hour < 6 || hour > 22;
    });

    if (offHoursAccess.length > recentLogs.length * 0.3) {
      riskScore += 15;
      factors.push('深夜時間帯のアクセス');
    }

    return {
      isAnomalous: riskScore > 50,
      riskScore: Math.min(riskScore, 100),
      factors,
    };
  }

  async getSecurityDashboard(tenantId: string): Promise<any> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const securityEvents = await this.auditLogRepository.find({
      where: {
        tenantId,
        resource: 'security',
        createdAt: { $gte: thirtyDaysAgo } as any,
      },
    });

    const eventCounts = securityEvents.reduce((acc, event) => {
      acc[event.action] = (acc[event.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const severityCounts = securityEvents.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topUsers = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.auditLogs', 'log')
      .where('log.tenantId = :tenantId', { tenantId })
      .andWhere('log.createdAt >= :date', { date: thirtyDaysAgo })
      .groupBy('user.id')
      .orderBy('COUNT(log.id)', 'DESC')
      .limit(10)
      .getMany();

    return {
      totalEvents: securityEvents.length,
      eventCounts,
      severityCounts,
      topUsers: topUsers.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
      })),
      riskLevel: this.calculateOverallRiskLevel(severityCounts),
    };
  }

  private async sendSecurityAlert(userId: string, tenantId: string, event: SecurityEvent): Promise<void> {
    // In a real implementation, this would send alerts via email, SMS, or webhook
    console.log(`🚨 Security Alert: ${event.type} - ${event.description}`, {
      userId,
      tenantId,
      event,
    });
  }

  private isIpInRange(ip: string, range: string): boolean {
    // Simple IP range check (in real implementation, use proper CIDR parsing)
    return ip.startsWith(range.split('/')[0]);
  }

  private calculateOverallRiskLevel(severityCounts: Record<string, number>): 'low' | 'medium' | 'high' | 'critical' {
    const critical = severityCounts.critical || 0;
    const high = severityCounts.high || 0;
    const medium = severityCounts.medium || 0;

    if (critical > 0) return 'critical';
    if (high > 5) return 'high';
    if (medium > 20 || high > 0) return 'medium';
    return 'low';
  }
}
