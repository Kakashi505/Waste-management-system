import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuctionService } from './auction.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateBidDto } from './dto/create-bid.dto';

@ApiTags('auction')
@Controller('auction')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AuctionController {
  constructor(private readonly auctionService: AuctionService) {}

  @Post('bids')
  @ApiOperation({ summary: '入札作成' })
  @ApiResponse({ status: 201, description: '入札作成成功' })
  @ApiResponse({ status: 400, description: 'バリデーションエラー' })
  async createBid(@Body() createBidDto: CreateBidDto, @Request() req) {
    // TODO: Get carrier from user context
    // For now, we'll assume the user is a carrier
    const carrier = { id: req.user.id } as any;
    return this.auctionService.createBid(createBidDto, carrier);
  }

  @Get('bids/case/:caseId')
  @ApiOperation({ summary: '案件の入札一覧取得' })
  @ApiResponse({ status: 200, description: '入札一覧取得成功' })
  async getBidsByCase(@Param('caseId') caseId: string) {
    return this.auctionService.getBidsByCase(caseId);
  }

  @Get('bids/carrier/:carrierId')
  @ApiOperation({ summary: '業者の入札一覧取得' })
  @ApiResponse({ status: 200, description: '入札一覧取得成功' })
  async getBidsByCarrier(@Param('carrierId') carrierId: string) {
    return this.auctionService.getBidsByCarrier(carrierId);
  }

  @Delete('bids/:bidId')
  @ApiOperation({ summary: '入札キャンセル' })
  @ApiResponse({ status: 200, description: '入札キャンセル成功' })
  @ApiResponse({ status: 404, description: '入札が見つかりません' })
  async cancelBid(@Param('bidId') bidId: string, @Request() req) {
    // TODO: Get carrier from user context
    const carrier = { id: req.user.id } as any;
    await this.auctionService.cancelBid(bidId, carrier);
    return { message: '入札がキャンセルされました' };
  }

  @Post('close/:caseId')
  @ApiOperation({ summary: 'オークション終了' })
  @ApiResponse({ status: 200, description: 'オークション終了成功' })
  @ApiResponse({ status: 404, description: '案件が見つかりません' })
  async closeAuction(@Param('caseId') caseId: string, @Request() req) {
    return this.auctionService.closeAuction(caseId, req.user);
  }

  @Get('status/:caseId')
  @ApiOperation({ summary: 'オークション状況取得' })
  @ApiResponse({ status: 200, description: '状況取得成功' })
  async getAuctionStatus(@Param('caseId') caseId: string) {
    return this.auctionService.getAuctionStatus(caseId);
  }
}
