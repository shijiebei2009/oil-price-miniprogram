import { Module } from '@nestjs/common'
import { SubscriptionMessageService } from './subscription-message.service'
import { SubscriptionMessageController } from './subscription-message.controller'

@Module({
  controllers: [SubscriptionMessageController],
  providers: [SubscriptionMessageService],
  exports: [SubscriptionMessageService],
})
export class SubscriptionMessageModule {}
