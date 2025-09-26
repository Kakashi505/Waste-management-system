import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bull';
import { CasesService } from './cases.service';
import { MatchingService } from './matching.service';
import { Case, CaseStatus, CasePriority } from '../../database/entities/case.entity';
import { User, UserRole } from '../../database/entities/user.entity';

describe('CasesService', () => {
  let service: CasesService;
  let mockCaseRepository: any;
  let mockMatchingQueue: any;
  let mockMatchingService: any;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: UserRole.WASTE_GENERATOR,
  };

  const mockCase = {
    id: '1',
    caseNumber: 'WM20240115001',
    siteLat: 35.6762,
    siteLng: 139.6503,
    siteAddress: '東京都渋谷区恵比寿1-1-1',
    wasteType: '一般廃棄物',
    wasteCategory: '可燃ごみ',
    scheduledDate: new Date('2024-01-15T10:00:00Z'),
    status: CaseStatus.NEW,
    priority: CasePriority.NORMAL,
    createdById: '1',
  };

  beforeEach(async () => {
    mockCaseRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    mockMatchingQueue = {
      add: jest.fn(),
    };

    mockMatchingService = {
      findMatchingCarriers: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CasesService,
        {
          provide: getRepositoryToken(Case),
          useValue: mockCaseRepository,
        },
        {
          provide: getQueueToken('matching'),
          useValue: mockMatchingQueue,
        },
        {
          provide: MatchingService,
          useValue: mockMatchingService,
        },
      ],
    }).compile();

    service = module.get<CasesService>(CasesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create new case and trigger matching', async () => {
      const createCaseDto = {
        siteLat: 35.6762,
        siteLng: 139.6503,
        siteAddress: '東京都渋谷区恵比寿1-1-1',
        wasteType: '一般廃棄物',
        wasteCategory: '可燃ごみ',
        scheduledDate: '2024-01-15T10:00:00Z',
      };

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      mockCaseRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockCaseRepository.create.mockReturnValue(mockCase);
      mockCaseRepository.save.mockResolvedValue(mockCase);

      const result = await service.create(createCaseDto, mockUser as User);

      expect(result).toEqual(mockCase);
      expect(mockCaseRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createCaseDto,
          createdById: mockUser.id,
          status: CaseStatus.NEW,
        })
      );
      expect(mockMatchingQueue.add).toHaveBeenCalledWith('match-carriers', {
        caseId: mockCase.id,
      });
    });
  });

  describe('findAll', () => {
    it('should return cases for waste generator', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockCase]),
      };

      mockCaseRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(mockUser as User);

      expect(result).toEqual([mockCase]);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'case.createdById = :userId',
        { userId: mockUser.id }
      );
    });

    it('should apply filters when provided', async () => {
      const filters = {
        status: CaseStatus.NEW,
        priority: CasePriority.HIGH,
        wasteType: '一般廃棄物',
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockCase]),
      };

      mockCaseRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll(mockUser as User, filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'case.status = :status',
        { status: CaseStatus.NEW }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'case.priority = :priority',
        { priority: CasePriority.HIGH }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'case.wasteType ILIKE :wasteType',
        { wasteType: '%一般廃棄物%' }
      );
    });
  });

  describe('findOne', () => {
    it('should return case with relations', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockCase),
      };

      mockCaseRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findOne('1', mockUser as User);

      expect(result).toEqual(mockCase);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('case.id = :id', { id: '1' });
    });

    it('should throw NotFoundException when case not found', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      mockCaseRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await expect(service.findOne('1', mockUser as User)).rejects.toThrow(
        '案件が見つかりません'
      );
    });
  });

  describe('updateStatus', () => {
    it('should update case status when valid transition', async () => {
      const updatedCase = { ...mockCase, status: CaseStatus.MATCHING };
      
      mockCaseRepository.save.mockResolvedValue(updatedCase);

      const result = await service.updateStatus('1', CaseStatus.MATCHING, mockUser as User);

      expect(result).toEqual(updatedCase);
      expect(mockCaseRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: CaseStatus.MATCHING,
        })
      );
    });

    it('should throw BadRequestException for invalid status transition', async () => {
      const caseWithDisposedStatus = { ...mockCase, status: CaseStatus.DISPOSED };
      
      await expect(
        service.updateStatus('1', CaseStatus.NEW, mockUser as User)
      ).rejects.toThrow('ステータスを 処分完了 から 新規 に変更できません');
    });
  });
});
