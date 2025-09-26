import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwnetJob, JwnetJobStatus } from '../../database/entities/jwnet-job.entity';

@Processor('jwnet')
export class JwnetProcessor {
  constructor(
    @InjectRepository(JwnetJob)
    private jwnetJobRepository: Repository<JwnetJob>,
  ) {}

  @Process('process-jwnet-job')
  async handleJwnetJob(job: Job<{ jobId: string }>) {
    const { jobId } = job.data;

    try {
      console.log(`Processing JWNET job ${jobId}`);

      const jwnetJob = await this.jwnetJobRepository.findOne({
        where: { id: jobId },
      });

      if (!jwnetJob) {
        throw new Error(`JWNET job ${jobId} not found`);
      }

      // Update job status to processing
      jwnetJob.status = JwnetJobStatus.PROCESSING;
      jwnetJob.attempts += 1;
      jwnetJob.lastAttemptAt = new Date();
      await this.jwnetJobRepository.save(jwnetJob);

      // Simulate JWNET API call
      const result = await this.callJwnetApi(jwnetJob);

      // Update job with result
      jwnetJob.status = JwnetJobStatus.COMPLETED;
      jwnetJob.externalId = result.externalId;
      jwnetJob.externalResponse = result.response;
      jwnetJob.nextRetryAt = null;
      jwnetJob.errorMessage = null;

      await this.jwnetJobRepository.save(jwnetJob);

      console.log(`JWNET job ${jobId} completed successfully`);

      return {
        jobId,
        status: 'completed',
        externalId: result.externalId,
      };
    } catch (error) {
      console.error(`Error processing JWNET job ${jobId}:`, error);

      // Update job with error
      const jwnetJob = await this.jwnetJobRepository.findOne({
        where: { id: jobId },
      });

      if (jwnetJob) {
        jwnetJob.status = jwnetJob.attempts >= jwnetJob.maxAttempts 
          ? JwnetJobStatus.ERROR 
          : JwnetJobStatus.RETRY;
        jwnetJob.errorMessage = error.message;
        
        if (jwnetJob.status === JwnetJobStatus.RETRY) {
          // Schedule retry with exponential backoff
          const retryDelay = Math.pow(2, jwnetJob.attempts) * 60000; // 1, 2, 4, 8 minutes
          jwnetJob.nextRetryAt = new Date(Date.now() + retryDelay);
        }

        await this.jwnetJobRepository.save(jwnetJob);
      }

      throw error;
    }
  }

  private async callJwnetApi(jwnetJob: JwnetJob): Promise<{
    externalId: string;
    response: any;
  }> {
    // TODO: Implement actual JWNET API integration
    // For now, simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay

    // Simulate success/failure based on job type
    const successRate = 0.8; // 80% success rate for simulation
    if (Math.random() > successRate) {
      throw new Error('JWNET API call failed');
    }

    return {
      externalId: `JWNET_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      response: {
        status: 'success',
        message: 'Manifest registered successfully',
        timestamp: new Date().toISOString(),
      },
    };
  }
}
