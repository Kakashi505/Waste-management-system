import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Bid, BidStatus } from '../../database/entities/bid.entity';
import { Case, CaseStatus } from '../../database/entities/case.entity';
import { Carrier } from '../../database/entities/carrier.entity';
import { User } from '../../database/entities/user.entity';
import { CreateBidDto } from './dto/create-bid.dto';

@Injectable()
export class AuctionService {
  constructor(
    @InjectRepository(Bid)
    private bidRepository: Repository<Bid>,
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    @InjectRepository(Carrier)
    private carrierRepository: Repository<Carrier>,
    @InjectQueue('auction')
    private auctionQueue: Queue,
  ) {}

  async createBid(createBidDto: CreateBidDto, carrier: Carrier): Promise<Bid> {
    // Verify case exists and is in auction mode
    const case_ = await this.caseRepository.findOne({
      where: { id: createBidDto.caseId },
    });

    if (!case_) {
      throw new NotFoundException('案件が見つかりません');
    }

    if (!case_.auctionEnabled) {
      throw new BadRequestException('この案件はオークション対象ではありません');
    }

    if (case_.status !== CaseStatus.MATCHING) {
      throw new BadRequestException('オークションはマッチング中の案件のみ可能です');
    }

    // Check if auction is still open
    const now = new Date();
    if (case_.auctionEndAt && now > case_.auctionEndAt) {
      throw new BadRequestException('オークションは終了しています');
    }

    // Check if carrier already has a bid for this case
    const existingBid = await this.bidRepository.findOne({
      where: { caseId: createBidDto.caseId, carrierId: carrier.id },
    });

    if (existingBid) {
      // Update existing bid
      existingBid.amount = createBidDto.amount;
      existingBid.message = createBidDto.message;
      return this.bidRepository.save(existingBid);
    }

    // Create new bid
    const bid = this.bidRepository.create({
      caseId: createBidDto.caseId,
      carrierId: carrier.id,
      amount: createBidDto.amount,
      message: createBidDto.message,
    });

    return this.bidRepository.save(bid);
  }

  async getBidsByCase(caseId: string): Promise<Bid[]> {
    return this.bidRepository.find({
      where: { caseId },
      relations: ['carrier'],
      order: { amount: 'ASC' }, // Sort by amount (lowest first)
    });
  }

  async getBidsByCarrier(carrierId: string): Promise<Bid[]> {
    return this.bidRepository.find({
      where: { carrierId },
      relations: ['case_'],
      order: { createdAt: 'DESC' },
    });
  }

  async cancelBid(bidId: string, carrier: Carrier): Promise<void> {
    const bid = await this.bidRepository.findOne({
      where: { id: bidId, carrierId: carrier.id },
    });

    if (!bid) {
      throw new NotFoundException('入札が見つかりません');
    }

    if (bid.status !== BidStatus.SUBMITTED) {
      throw new BadRequestException('この入札はキャンセルできません');
    }

    bid.status = BidStatus.CANCELLED;
    await this.bidRepository.save(bid);
  }

  async closeAuction(caseId: string, user: User): Promise<Bid | null> {
    const case_ = await this.caseRepository.findOne({
      where: { id: caseId },
    });

    if (!case_) {
      throw new NotFoundException('案件が見つかりません');
    }

    if (!case_.auctionEnabled) {
      throw new BadRequestException('この案件はオークション対象ではありません');
    }

    // Get all valid bids
    const bids = await this.bidRepository.find({
      where: { 
        caseId,
        status: BidStatus.SUBMITTED,
      },
      relations: ['carrier'],
      order: { amount: 'ASC' },
    });

    if (bids.length === 0) {
      // No bids, assign to best matching carrier
      return null;
    }

    // Award to lowest bidder
    const winningBid = bids[0];
    winningBid.status = BidStatus.WON;

    // Update case
    case_.assignedCarrierId = winningBid.carrierId;
    case_.status = CaseStatus.ASSIGNED;

    await this.bidRepository.save(winningBid);
    await this.caseRepository.save(case_);

    // Notify other bidders
    await this.auctionQueue.add('notify-bidders', {
      caseId,
      winningBidId: winningBid.id,
    });

    return winningBid;
  }

  async getAuctionStatus(caseId: string): Promise<{
    isOpen: boolean;
    timeRemaining?: number;
    bidCount: number;
    lowestBid?: number;
    highestBid?: number;
  }> {
    const case_ = await this.caseRepository.findOne({
      where: { id: caseId },
    });

    if (!case_ || !case_.auctionEnabled) {
      return {
        isOpen: false,
        bidCount: 0,
      };
    }

    const now = new Date();
    const isOpen = case_.auctionEndAt ? now < case_.auctionEndAt : true;
    const timeRemaining = case_.auctionEndAt 
      ? Math.max(0, case_.auctionEndAt.getTime() - now.getTime())
      : undefined;

    const bids = await this.bidRepository.find({
      where: { 
        caseId,
        status: BidStatus.SUBMITTED,
      },
    });

    const bidCount = bids.length;
    const amounts = bids.map(bid => bid.amount);
    const lowestBid = amounts.length > 0 ? Math.min(...amounts) : undefined;
    const highestBid = amounts.length > 0 ? Math.max(...amounts) : undefined;

    return {
      isOpen,
      timeRemaining,
      bidCount,
      lowestBid,
      highestBid,
    };
  }
}
