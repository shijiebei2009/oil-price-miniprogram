import { Module } from '@nestjs/common'
import { OilPriceController } from './oil-price.controller'
import { OilPriceService } from './oil-price.service'

@Module({
  controllers: [OilPriceController],
  providers: [OilPriceService],
  exports: [OilPriceService]
})
export class OilPriceModule {}
