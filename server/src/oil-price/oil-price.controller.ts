import { Controller, Get } from '@nestjs/common'
import { OilPriceService } from './oil-price.service'

@Controller('oil-price')
export class OilPriceController {
  constructor(private readonly oilPriceService: OilPriceService) {}

  @Get('current')
  getCurrentPrices() {
    console.log('收到获取当前油价请求')
    const data = this.oilPriceService.getCurrentPrices()

    console.log('返回响应:', {
      code: 200,
      msg: 'success',
      data
    })

    return {
      code: 200,
      msg: 'success',
      data
    }
  }
}
