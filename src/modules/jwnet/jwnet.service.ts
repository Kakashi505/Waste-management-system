import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { JwnetJob, JwnetJobType, JwnetJobStatus } from '../../database/entities/jwnet-job.entity';
import { Case } from '../../database/entities/case.entity';
import { CreateJwnetJobDto } from './dto/create-jwnet-job.dto';

@Injectable()
export class JwnetService {
  constructor(
    @InjectRepository(JwnetJob)
    private jwnetJobRepository: Repository<JwnetJob>,
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    @InjectQueue('jwnet')
    private jwnetQueue: Queue,
  ) {}

  async createJob(createJwnetJobDto: CreateJwnetJobDto): Promise<JwnetJob> {
    // Verify case exists
    const case_ = await this.caseRepository.findOne({
      where: { id: createJwnetJobDto.caseId },
    });

    if (!case_) {
      throw new NotFoundException('案件が見つかりません');
    }

    const job = this.jwnetJobRepository.create(createJwnetJobDto);
    const savedJob = await this.jwnetJobRepository.save(job);

    // Queue the job for processing
    await this.jwnetQueue.add('process-jwnet-job', {
      jobId: savedJob.id,
    });

    return savedJob;
  }

  async findAll(): Promise<JwnetJob[]> {
    return this.jwnetJobRepository.find({
      relations: ['case_'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByCase(caseId: string): Promise<JwnetJob[]> {
    return this.jwnetJobRepository.find({
      where: { caseId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<JwnetJob> {
    const job = await this.jwnetJobRepository.findOne({
      where: { id },
      relations: ['case_'],
    });

    if (!job) {
      throw new NotFoundException('JWNETジョブが見つかりません');
    }

    return job;
  }

  async retryJob(id: string): Promise<JwnetJob> {
    const job = await this.findOne(id);

    if (job.status === JwnetJobStatus.COMPLETED) {
      throw new Error('完了済みのジョブは再実行できません');
    }

    job.status = JwnetJobStatus.PENDING;
    job.nextRetryAt = new Date();
    job.attempts = 0;

    const updatedJob = await this.jwnetJobRepository.save(job);

    // Queue for retry
    await this.jwnetQueue.add('process-jwnet-job', {
      jobId: updatedJob.id,
    });

    return updatedJob;
  }

  async getJobStatus(id: string): Promise<{
    status: JwnetJobStatus;
    attempts: number;
    lastAttemptAt?: Date;
    nextRetryAt?: Date;
    errorMessage?: string;
  }> {
    const job = await this.findOne(id);

    return {
      status: job.status,
      attempts: job.attempts,
      lastAttemptAt: job.lastAttemptAt,
      nextRetryAt: job.nextRetryAt,
      errorMessage: job.errorMessage,
    };
  }

  async generateManifestPayload(caseId: string): Promise<Record<string, any>> {
    const case_ = await this.caseRepository.findOne({
      where: { id: caseId },
      relations: ['assignedCarrier', 'createdBy'],
    });

    if (!case_) {
      throw new NotFoundException('案件が見つかりません');
    }

    // Generate JWNET manifest payload based on case data
    const payload = {
      manifestId: `WM${case_.caseNumber}`,
      wasteGenerator: {
        name: case_.createdBy.name,
        company: case_.createdBy.companyName,
        address: case_.createdBy.address,
        phone: case_.createdBy.phone,
        email: case_.createdBy.email,
      },
      carrier: case_.assignedCarrier ? {
        name: case_.assignedCarrier.name,
        companyCode: case_.assignedCarrier.companyCode,
        permits: case_.assignedCarrier.permits,
      } : null,
      wasteInfo: {
        type: case_.wasteType,
        category: case_.wasteCategory,
        estimatedVolume: case_.estimatedVolume,
        estimatedWeight: case_.estimatedWeight,
      },
      collectionInfo: {
        siteAddress: case_.siteAddress,
        siteLat: case_.siteLat,
        siteLng: case_.siteLng,
        scheduledDate: case_.scheduledDate,
        specialRequirements: case_.specialRequirements,
      },
      status: case_.status,
      createdAt: case_.createdAt,
    };

    return payload;
  }

  async processPendingJobs(): Promise<number> {
    const pendingJobs = await this.jwnetJobRepository.find({
      where: {
        status: JwnetJobStatus.PENDING,
      },
      order: { createdAt: 'ASC' },
      take: 10, // Process up to 10 jobs at a time
    });

    for (const job of pendingJobs) {
      await this.jwnetQueue.add('process-jwnet-job', {
        jobId: job.id,
      });
    }

    return pendingJobs.length;
  }
}
