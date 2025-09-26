import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User, UserRole } from '../src/database/entities/user.entity';
import { Case, CaseStatus, CasePriority } from '../src/database/entities/case.entity';

describe('Cases (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env.test', '.env'],
        }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.TEST_DB_HOST || 'localhost',
          port: parseInt(process.env.TEST_DB_PORT) || 5433,
          username: process.env.TEST_DB_USERNAME || 'postgres',
          password: process.env.TEST_DB_PASSWORD || 'password',
          database: process.env.TEST_DB_DATABASE || 'waste_management_test',
          entities: [User, Case],
          synchronize: true,
          dropSchema: true,
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    dataSource = app.get(DataSource);
    await app.init();
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    // テストデータをクリア
    await dataSource.getRepository(Case).clear();
    await dataSource.getRepository(User).clear();

    // テスト用ユーザーを作成してログイン
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: UserRole.WASTE_GENERATOR,
    };

    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(userData);

    accessToken = registerResponse.body.access_token;
    userId = registerResponse.body.user.id;
  });

  describe('/api/cases (POST)', () => {
    it('should create a new case', () => {
      const caseData = {
        siteLat: 35.6762,
        siteLng: 139.6503,
        siteAddress: '東京都渋谷区恵比寿1-1-1',
        wasteType: '一般廃棄物',
        wasteCategory: '可燃ごみ',
        scheduledDate: '2024-01-15T10:00:00Z',
        priority: CasePriority.NORMAL,
      };

      return request(app.getHttpServer())
        .post('/api/cases')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(caseData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('caseNumber');
          expect(res.body.siteLat).toBe(caseData.siteLat);
          expect(res.body.siteLng).toBe(caseData.siteLng);
          expect(res.body.wasteType).toBe(caseData.wasteType);
          expect(res.body.status).toBe(CaseStatus.NEW);
        });
    });

    it('should return 400 when validation fails', () => {
      const invalidCaseData = {
        siteLat: 'invalid-lat',
        siteLng: 139.6503,
        siteAddress: '',
        wasteType: '',
        wasteCategory: '',
        scheduledDate: 'invalid-date',
      };

      return request(app.getHttpServer())
        .post('/api/cases')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidCaseData)
        .expect(400);
    });

    it('should return 401 without authentication', () => {
      const caseData = {
        siteLat: 35.6762,
        siteLng: 139.6503,
        siteAddress: '東京都渋谷区恵比寿1-1-1',
        wasteType: '一般廃棄物',
        wasteCategory: '可燃ごみ',
        scheduledDate: '2024-01-15T10:00:00Z',
      };

      return request(app.getHttpServer())
        .post('/api/cases')
        .send(caseData)
        .expect(401);
    });
  });

  describe('/api/cases (GET)', () => {
    beforeEach(async () => {
      // テスト用案件を作成
      const caseData = {
        siteLat: 35.6762,
        siteLng: 139.6503,
        siteAddress: '東京都渋谷区恵比寿1-1-1',
        wasteType: '一般廃棄物',
        wasteCategory: '可燃ごみ',
        scheduledDate: '2024-01-15T10:00:00Z',
      };

      await request(app.getHttpServer())
        .post('/api/cases')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(caseData);
    });

    it('should return cases for authenticated user', () => {
      return request(app.getHttpServer())
        .get('/api/cases')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('caseNumber');
          expect(res.body[0]).toHaveProperty('wasteType');
        });
    });

    it('should filter cases by status', () => {
      return request(app.getHttpServer())
        .get('/api/cases?status=新規')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach((case_) => {
            expect(case_.status).toBe(CaseStatus.NEW);
          });
        });
    });

    it('should filter cases by priority', () => {
      return request(app.getHttpServer())
        .get('/api/cases?priority=通常')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach((case_) => {
            expect(case_.priority).toBe(CasePriority.NORMAL);
          });
        });
    });
  });

  describe('/api/cases/:id (GET)', () => {
    let caseId: string;

    beforeEach(async () => {
      // テスト用案件を作成
      const caseData = {
        siteLat: 35.6762,
        siteLng: 139.6503,
        siteAddress: '東京都渋谷区恵比寿1-1-1',
        wasteType: '一般廃棄物',
        wasteCategory: '可燃ごみ',
        scheduledDate: '2024-01-15T10:00:00Z',
      };

      const response = await request(app.getHttpServer())
        .post('/api/cases')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(caseData);

      caseId = response.body.id;
    });

    it('should return case details', () => {
      return request(app.getHttpServer())
        .get(`/api/cases/${caseId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', caseId);
          expect(res.body).toHaveProperty('caseNumber');
          expect(res.body).toHaveProperty('wasteType');
          expect(res.body).toHaveProperty('createdBy');
        });
    });

    it('should return 404 for non-existent case', () => {
      return request(app.getHttpServer())
        .get('/api/cases/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('/api/cases/:id/status (PATCH)', () => {
    let caseId: string;

    beforeEach(async () => {
      // テスト用案件を作成
      const caseData = {
        siteLat: 35.6762,
        siteLng: 139.6503,
        siteAddress: '東京都渋谷区恵比寿1-1-1',
        wasteType: '一般廃棄物',
        wasteCategory: '可燃ごみ',
        scheduledDate: '2024-01-15T10:00:00Z',
      };

      const response = await request(app.getHttpServer())
        .post('/api/cases')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(caseData);

      caseId = response.body.id;
    });

    it('should update case status', () => {
      return request(app.getHttpServer())
        .patch(`/api/cases/${caseId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: CaseStatus.MATCHING })
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe(CaseStatus.MATCHING);
        });
    });

    it('should return 400 for invalid status transition', () => {
      return request(app.getHttpServer())
        .patch(`/api/cases/${caseId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: CaseStatus.DISPOSED })
        .expect(400);
    });
  });
});
