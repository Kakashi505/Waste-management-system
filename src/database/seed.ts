import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { Carrier } from './entities/carrier.entity';
import { Case, CaseStatus, CasePriority } from './entities/case.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'waste_management',
  entities: [User, Carrier, Case],
  synchronize: false,
  logging: true,
});

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('データベース接続成功');

    // ユーザーデータのシード
    await seedUsers();
    
    // 業者データのシード
    await seedCarriers();
    
    // 案件データのシード
    await seedCases();

    console.log('シードデータの作成が完了しました');
  } catch (error) {
    console.error('シードデータの作成中にエラーが発生しました:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

async function seedUsers() {
  const userRepository = AppDataSource.getRepository(User);

  const users = [
    {
      email: 'admin@waste-management.jp',
      password: 'admin123',
      name: 'システム管理者',
      companyName: '廃棄物管理システム株式会社',
      role: UserRole.ADMIN,
      phone: '03-1234-5678',
      address: '東京都渋谷区恵比寿1-1-1',
    },
    {
      email: 'generator@example.com',
      password: 'generator123',
      name: '田中太郎',
      companyName: '株式会社サンプル製造',
      role: UserRole.WASTE_GENERATOR,
      phone: '03-2345-6789',
      address: '東京都新宿区西新宿2-2-2',
    },
    {
      email: 'contractor@example.com',
      password: 'contractor123',
      name: '佐藤花子',
      companyName: '株式会社エココンサルティング',
      role: UserRole.CONTRACTOR,
      phone: '03-3456-7890',
      address: '東京都港区六本木3-3-3',
    },
    {
      email: 'carrier@example.com',
      password: 'carrier123',
      name: '山田次郎',
      companyName: '株式会社クリーンサービス',
      role: UserRole.CARRIER,
      phone: '03-4567-8901',
      address: '東京都品川区大崎4-4-4',
    },
  ];

  for (const userData of users) {
    const existingUser = await userRepository.findOne({ where: { email: userData.email } });
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const user = userRepository.create({
        ...userData,
        passwordHash: hashedPassword,
      });
      await userRepository.save(user);
      console.log(`ユーザー作成: ${userData.email}`);
    }
  }
}

async function seedCarriers() {
  const carrierRepository = AppDataSource.getRepository(Carrier);

  const carriers = [
    {
      name: '株式会社クリーンサービス',
      companyCode: 'CAR001',
      permits: [
        {
          permitNumber: 'A123456789',
          permitType: '一般廃棄物収集運搬業',
          validFrom: '2024-01-01',
          validTo: '2026-12-31',
          wasteTypes: ['一般廃棄物', '可燃ごみ', '不燃ごみ'],
        },
        {
          permitNumber: 'B987654321',
          permitType: '産業廃棄物収集運搬業',
          validFrom: '2024-01-01',
          validTo: '2026-12-31',
          wasteTypes: ['産業廃棄物', 'プラスチック類', '金属類'],
        },
      ],
      serviceAreas: [
        {
          type: 'radius',
          center: { lat: 35.6762, lng: 139.6503 },
          radius: 50000, // 50km
        },
      ],
      priceMatrix: [
        {
          wasteType: '一般廃棄物',
          basePrice: 5000,
          pricePerUnit: 50,
          unit: 'kg',
          minimumCharge: 3000,
          additionalFees: [
            { name: '夜間料金', amount: 1000 },
            { name: '緊急対応料金', amount: 2000 },
          ],
        },
        {
          wasteType: '産業廃棄物',
          basePrice: 8000,
          pricePerUnit: 80,
          unit: 'kg',
          minimumCharge: 5000,
        },
      ],
      reliabilityScore: 0.85,
      contactPerson: '山田次郎',
      phone: '03-4567-8901',
      email: 'carrier@example.com',
      address: '東京都品川区大崎4-4-4',
    },
    {
      name: '株式会社エコリサイクル',
      companyCode: 'CAR002',
      permits: [
        {
          permitNumber: 'C456789123',
          permitType: '一般廃棄物収集運搬業',
          validFrom: '2024-01-01',
          validTo: '2026-12-31',
          wasteTypes: ['一般廃棄物', '資源ごみ', '粗大ごみ'],
        },
      ],
      serviceAreas: [
        {
          type: 'polygon',
          coordinates: [
            [35.6, 139.6],
            [35.7, 139.6],
            [35.7, 139.8],
            [35.6, 139.8],
            [35.6, 139.6],
          ],
        },
      ],
      priceMatrix: [
        {
          wasteType: '一般廃棄物',
          basePrice: 4500,
          pricePerUnit: 45,
          unit: 'kg',
          minimumCharge: 2500,
        },
        {
          wasteType: '資源ごみ',
          basePrice: 3000,
          pricePerUnit: 30,
          unit: 'kg',
          minimumCharge: 2000,
        },
      ],
      reliabilityScore: 0.92,
      contactPerson: '鈴木一郎',
      phone: '03-5678-9012',
      email: 'eco@example.com',
      address: '東京都世田谷区三軒茶屋5-5-5',
    },
    {
      name: '株式会社グリーンクリーン',
      companyCode: 'CAR003',
      permits: [
        {
          permitNumber: 'D789123456',
          permitType: '一般廃棄物収集運搬業',
          validFrom: '2024-01-01',
          validTo: '2026-12-31',
          wasteTypes: ['一般廃棄物', '可燃ごみ', '不燃ごみ', '粗大ごみ'],
        },
      ],
      serviceAreas: [
        {
          type: 'radius',
          center: { lat: 35.7, lng: 139.7 },
          radius: 30000, // 30km
        },
      ],
      priceMatrix: [
        {
          wasteType: '一般廃棄物',
          basePrice: 5500,
          pricePerUnit: 55,
          unit: 'kg',
          minimumCharge: 3500,
        },
        {
          wasteType: '粗大ごみ',
          basePrice: 15000,
          pricePerUnit: 150,
          unit: 'truck',
          minimumCharge: 10000,
        },
      ],
      reliabilityScore: 0.78,
      contactPerson: '高橋三郎',
      phone: '03-6789-0123',
      email: 'green@example.com',
      address: '東京都練馬区豊玉北6-6-6',
    },
  ];

  for (const carrierData of carriers) {
    const existingCarrier = await carrierRepository.findOne({ where: { companyCode: carrierData.companyCode } });
    if (!existingCarrier) {
      const carrier = carrierRepository.create(carrierData);
      await carrierRepository.save(carrier);
      console.log(`業者作成: ${carrierData.name}`);
    }
  }
}

async function seedCases() {
  const caseRepository = AppDataSource.getRepository(Case);
  const userRepository = AppDataSource.getRepository(User);
  const carrierRepository = AppDataSource.getRepository(Carrier);

  // ユーザーと業者を取得
  const generator = await userRepository.findOne({ where: { email: 'generator@example.com' } });
  const carrier = await carrierRepository.findOne({ where: { companyCode: 'CAR001' } });

  if (!generator || !carrier) {
    console.log('ユーザーまたは業者が見つかりません。シードをスキップします。');
    return;
  }

  const cases = [
    {
      caseNumber: 'WM20240115001',
      siteLat: 35.6762,
      siteLng: 139.6503,
      siteAddress: '東京都渋谷区恵比寿1-1-1',
      wasteType: '一般廃棄物',
      wasteCategory: '可燃ごみ',
      estimatedVolume: 2.5,
      estimatedWeight: 1000,
      scheduledDate: new Date('2024-01-15T10:00:00Z'),
      status: CaseStatus.ASSIGNED,
      priority: CasePriority.HIGH,
      specialRequirements: '午前中のみ対応可能',
      createdById: generator.id,
      assignedCarrierId: carrier.id,
      autoAssign: false,
      auctionEnabled: false,
    },
    {
      caseNumber: 'WM20240115002',
      siteLat: 35.6862,
      siteLng: 139.6603,
      siteAddress: '東京都新宿区西新宿2-2-2',
      wasteType: '産業廃棄物',
      wasteCategory: 'プラスチック類',
      estimatedVolume: 1.0,
      estimatedWeight: 500,
      scheduledDate: new Date('2024-01-16T14:00:00Z'),
      status: CaseStatus.MATCHING,
      priority: CasePriority.NORMAL,
      createdById: generator.id,
      autoAssign: true,
      auctionEnabled: true,
      auctionStartAt: new Date('2024-01-10T09:00:00Z'),
      auctionEndAt: new Date('2024-01-12T17:00:00Z'),
    },
    {
      caseNumber: 'WM20240115003',
      siteLat: 35.6962,
      siteLng: 139.6703,
      siteAddress: '東京都港区六本木3-3-3',
      wasteType: '一般廃棄物',
      wasteCategory: '不燃ごみ',
      estimatedVolume: 1.5,
      estimatedWeight: 750,
      scheduledDate: new Date('2024-01-17T09:00:00Z'),
      status: CaseStatus.NEW,
      priority: CasePriority.LOW,
      createdById: generator.id,
      autoAssign: false,
      auctionEnabled: false,
    },
  ];

  for (const caseData of cases) {
    const existingCase = await caseRepository.findOne({ where: { caseNumber: caseData.caseNumber } });
    if (!existingCase) {
      const case_ = caseRepository.create(caseData);
      await caseRepository.save(case_);
      console.log(`案件作成: ${caseData.caseNumber}`);
    }
  }
}

// スクリプト実行
if (require.main === module) {
  seed();
}

export { seed };
