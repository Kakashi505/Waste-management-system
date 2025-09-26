import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AiService } from './ai.service';

@ApiTags('ai')
@Controller('api/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('classify-waste')
  @ApiOperation({ summary: 'AI-powered waste classification' })
  @ApiResponse({ status: 200, description: 'Waste classified successfully' })
  async classifyWaste(@Body() body: { description: string; imageData?: string }) {
    return this.aiService.classifyWaste(body.description, body.imageData);
  }

  @Post('optimize-route')
  @ApiOperation({ summary: 'AI-powered route optimization' })
  @ApiResponse({ status: 200, description: 'Route optimized successfully' })
  async optimizeRoute(@Body() body: { caseIds: string[] }) {
    // Mock implementation - in real app, fetch cases by IDs
    const mockCases = body.caseIds.map(id => ({
      id,
      siteLat: 35.6762 + Math.random() * 0.1,
      siteLng: 139.6503 + Math.random() * 0.1,
      siteAddress: `東京都渋谷区${id}`,
      wasteType: '一般廃棄物',
    }));
    
    return this.aiService.optimizeRoute(mockCases as any);
  }

  @Post('dynamic-pricing')
  @ApiOperation({ summary: 'AI-powered dynamic pricing calculation' })
  @ApiResponse({ status: 200, description: 'Dynamic pricing calculated successfully' })
  async calculateDynamicPricing(@Body() body: { caseId: string; carrierId: string }) {
    // Mock implementation
    const mockCase = {
      id: body.caseId,
      siteLat: 35.6762,
      siteLng: 139.6503,
      siteAddress: '東京都渋谷区恵比寿1-1-1',
      wasteType: '一般廃棄物',
    };
    
    const mockCarrier = {
      id: body.carrierId,
      name: 'サンプル業者',
      rating: 4.5,
    };
    
    return this.aiService.calculateDynamicPricing(mockCase as any, mockCarrier as any);
  }

  @Get('predict-maintenance/:carrierId')
  @ApiOperation({ summary: 'AI-powered maintenance prediction' })
  @ApiResponse({ status: 200, description: 'Maintenance prediction generated successfully' })
  async predictMaintenance(@Param('carrierId') carrierId: string) {
    return this.aiService.predictMaintenance(carrierId);
  }

  @Post('optimize-assignment')
  @ApiOperation({ summary: 'AI-powered carrier assignment optimization' })
  @ApiResponse({ status: 200, description: 'Carrier assignment optimized successfully' })
  async optimizeCarrierAssignment(@Body() body: { caseId: string }) {
    // Mock implementation
    const mockCase = {
      id: body.caseId,
      siteLat: 35.6762,
      siteLng: 139.6503,
      siteAddress: '東京都渋谷区恵比寿1-1-1',
      wasteType: '一般廃棄物',
    };
    
    return this.aiService.optimizeCarrierAssignment(mockCase as any);
  }
}
