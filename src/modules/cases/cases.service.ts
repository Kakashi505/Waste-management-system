import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

import { Case, CaseStatus, CasePriority } from '../../database/entities/case.entity';
import { User, UserRole } from '../../database/entities/user.entity';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { MatchingService } from './matching.service';

@Injectable()
export class CasesService {
  constructor(
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    @InjectQueue('matching')
    private matchingQueue: Queue,
    private matchingService: MatchingService,
  ) {}

  async create(createCaseDto: CreateCaseDto, createdBy: User): Promise<Case> {
    // Generate case number
    const caseNumber = await this.generateCaseNumber();

    const case_ = this.caseRepository.create({
      ...createCaseDto,
      caseNumber,
      createdById: createdBy.id,
      status: CaseStatus.NEW,
    });

    const savedCase = await this.caseRepository.save(case_);

    // Trigger matching process
    await this.matchingQueue.add('match-carriers', {
      caseId: savedCase.id,
    });

    return savedCase;
  }

  async findAll(
    user: User,
    filters: {
      status?: CaseStatus;
      priority?: CasePriority;
      wasteType?: string;
      dateFrom?: Date;
      dateTo?: Date;
    } = {},
  ): Promise<Case[]> {
    const query = this.caseRepository.createQueryBuilder('case')
      .leftJoinAndSelect('case.createdBy', 'createdBy')
      .leftJoinAndSelect('case.assignedCarrier', 'assignedCarrier')
      .leftJoinAndSelect('case.bids', 'bids')
      .leftJoinAndSelect('bids.carrier', 'bidCarrier');

    // Role-based filtering
    if (user.role === UserRole.WASTE_GENERATOR) {
      query.andWhere('case.createdById = :userId', { userId: user.id });
    } else if (user.role === UserRole.CARRIER) {
      query.andWhere('(case.assignedCarrierId = :userId OR bids.carrierId = :userId)', { userId: user.id });
    }

    // Apply filters
    if (filters.status) {
      query.andWhere('case.status = :status', { status: filters.status });
    }
    if (filters.priority) {
      query.andWhere('case.priority = :priority', { priority: filters.priority });
    }
    if (filters.wasteType) {
      query.andWhere('case.wasteType ILIKE :wasteType', { wasteType: `%${filters.wasteType}%` });
    }
    if (filters.dateFrom) {
      query.andWhere('case.scheduledDate >= :dateFrom', { dateFrom: filters.dateFrom });
    }
    if (filters.dateTo) {
      query.andWhere('case.scheduledDate <= :dateTo', { dateTo: filters.dateTo });
    }

    return query
      .orderBy('case.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string, user: User): Promise<Case> {
    const query = this.caseRepository.createQueryBuilder('case')
      .leftJoinAndSelect('case.createdBy', 'createdBy')
      .leftJoinAndSelect('case.assignedCarrier', 'assignedCarrier')
      .leftJoinAndSelect('case.bids', 'bids')
      .leftJoinAndSelect('bids.carrier', 'bidCarrier')
      .leftJoinAndSelect('case.photos', 'photos')
      .leftJoinAndSelect('case.gpsEvents', 'gpsEvents')
      .where('case.id = :id', { id });

    // Role-based access control
    if (user.role === UserRole.WASTE_GENERATOR) {
      query.andWhere('case.createdById = :userId', { userId: user.id });
    } else if (user.role === UserRole.CARRIER) {
      query.andWhere('(case.assignedCarrierId = :userId OR bids.carrierId = :userId)', { userId: user.id });
    }

    const case_ = await query.getOne();

    if (!case_) {
      throw new NotFoundException('案件が見つかりません');
    }

    return case_;
  }

  async update(id: string, updateCaseDto: UpdateCaseDto, user: User): Promise<Case> {
    const case_ = await this.findOne(id, user);

    // Check if user can update this case
    if (user.role === UserRole.WASTE_GENERATOR && case_.createdById !== user.id) {
      throw new BadRequestException('この案件を更新する権限がありません');
    }

    Object.assign(case_, updateCaseDto);
    return this.caseRepository.save(case_);
  }

  async updateStatus(
    id: string,
    status: CaseStatus,
    user: User,
    reason?: string,
  ): Promise<Case> {
    const case_ = await this.findOne(id, user);

    // Validate status transition
    if (!this.isValidStatusTransition(case_.status, status)) {
      throw new BadRequestException(`ステータスを ${case_.status} から ${status} に変更できません`);
    }

    case_.status = status;
    const updatedCase = await this.caseRepository.save(case_);

    // Log status change
    // TODO: Add audit log

    return updatedCase;
  }

  async assignCarrier(id: string, carrierId: string, user: User): Promise<Case> {
    const case_ = await this.findOne(id, user);

    if (case_.status !== CaseStatus.MATCHING) {
      throw new BadRequestException('マッチング中の案件のみ業者を割り当てできます');
    }

    case_.assignedCarrierId = carrierId;
    case_.status = CaseStatus.ASSIGNED;

    return this.caseRepository.save(case_);
  }

  async cancel(id: string, user: User, reason?: string): Promise<Case> {
    const case_ = await this.findOne(id, user);

    if (case_.status === CaseStatus.DISPOSED) {
      throw new BadRequestException('処分完了済みの案件はキャンセルできません');
    }

    case_.status = CaseStatus.CANCELLED;
    return this.caseRepository.save(case_);
  }

  private async generateCaseNumber(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    const prefix = `WM${year}${month}${day}`;
    
    const lastCase = await this.caseRepository.findOne({
      where: { caseNumber: Like(`${prefix}%`) },
      order: { caseNumber: 'DESC' },
    });

    let sequence = 1;
    if (lastCase) {
      const lastSequence = parseInt(lastCase.caseNumber.slice(-4));
      sequence = lastSequence + 1;
    }

    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }

  private isValidStatusTransition(currentStatus: CaseStatus, newStatus: CaseStatus): boolean {
    const validTransitions: Record<CaseStatus, CaseStatus[]> = {
      [CaseStatus.NEW]: [CaseStatus.MATCHING, CaseStatus.CANCELLED],
      [CaseStatus.MATCHING]: [CaseStatus.ASSIGNED, CaseStatus.CANCELLED],
      [CaseStatus.ASSIGNED]: [CaseStatus.COLLECTED, CaseStatus.CANCELLED],
      [CaseStatus.COLLECTED]: [CaseStatus.DISPOSED],
      [CaseStatus.DISPOSED]: [],
      [CaseStatus.CANCELLED]: [],
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }
}
