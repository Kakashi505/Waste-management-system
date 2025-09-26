import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { CustomValidationPipe } from './common/pipes/validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(new CustomValidationPipe());

  // Global exception filters
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  // CORS configuration
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('廃棄物管理システム API')
    .setDescription('Waste Management System API for Japanese clients')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', '認証関連')
    .addTag('cases', '廃棄物依頼管理')
    .addTag('carriers', '収集運搬業者管理')
    .addTag('photos', '写真管理')
    .addTag('gps', 'GPS位置情報管理')
    .addTag('auction', '逆オークション')
    .addTag('jwnet', '電子マニフェスト連携')
    .addTag('notifications', '通知管理')
    .addTag('reports', 'レポート・統計')
    .addTag('health', 'ヘルスチェック')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: '廃棄物管理システム API ドキュメント',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 廃棄物管理システムが起動しました: http://localhost:${port}`);
  console.log(`📚 API ドキュメント: http://localhost:${port}/api/docs`);
}

bootstrap();
