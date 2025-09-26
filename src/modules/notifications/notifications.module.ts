import { Module } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { CasesModule } from '../cases/cases.module';
import { AuctionModule } from '../auction/auction.module';

@Module({
  imports: [CasesModule, AuctionModule],
  providers: [NotificationsGateway, NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
