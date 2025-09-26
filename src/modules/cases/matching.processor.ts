import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { MatchingService } from './matching.service';
import { CasesService } from './cases.service';

@Processor('matching')
export class MatchingProcessor {
  constructor(
    private matchingService: MatchingService,
    private casesService: CasesService,
  ) {}

  @Process('match-carriers')
  async handleMatching(job: Job<{ caseId: string }>) {
    const { caseId } = job.data;

    try {
      console.log(`Starting matching process for case ${caseId}`);

      // Find matching carriers
      const matchingResults = await this.matchingService.findMatchingCarriers(caseId);

      console.log(`Found ${matchingResults.length} matching carriers for case ${caseId}`);

      // Update case status to MATCHING
      // Note: In a real implementation, you would update the case status here
      // await this.casesService.updateStatus(caseId, CaseStatus.MATCHING, user);

      // If auto-assign is enabled, assign the best carrier
      // if (case_.autoAssign && matchingResults.length > 0) {
      //   const bestCarrier = matchingResults[0];
      //   await this.casesService.assignCarrier(caseId, bestCarrier.carrier.id, user);
      // }

      return {
        caseId,
        matchingCount: matchingResults.length,
        topCarriers: matchingResults.slice(0, 5).map(result => ({
          carrierId: result.carrier.id,
          carrierName: result.carrier.name,
          score: result.score,
          reasons: result.reasons,
        })),
      };
    } catch (error) {
      console.error(`Error in matching process for case ${caseId}:`, error);
      throw error;
    }
  }
}
