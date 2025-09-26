import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BackupService } from './backup.service';
import { BackupController } from './backup.controller';
import { DatabaseBackupService } from './database-backup.service';
import { FileBackupService } from './file-backup.service';
import { RestoreService } from './restore.service';
import { AuditLog } from '../../database/entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog]),
  ],
  providers: [BackupService, DatabaseBackupService, FileBackupService, RestoreService],
  controllers: [BackupController],
  exports: [BackupService, DatabaseBackupService, FileBackupService, RestoreService],
})
export class BackupModule {}
