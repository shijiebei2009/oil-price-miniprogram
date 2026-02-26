import { Controller, Get, Query } from '@nestjs/common'
import { OilPriceService } from './oil-price.service'

@Controller('oil-price')
export class OilPriceController {
  constructor(private readonly oilPriceService: OilPriceService) {}

  // 获取当前油价（支持城市参数）
  @Get('current')
  getCurrentPrices(@Query('city') city?: string) {
    console.log('收到获取当前油价请求，城市:', city)
    const data = this.oilPriceService.getCurrentPrices(city)

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

  // 获取城市列表
  @Get('cities')
  getCityList() {
    console.log('收到获取城市列表请求')
    const data = this.oilPriceService.getCityList()

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

  // 获取所有城市价格对比
  @Get('cities/compare')
  getAllCityPrices() {
    console.log('收到获取城市价格对比请求')
    const data = this.oilPriceService.getAllCityPrices()

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

  // 获取历史价格
  @Get('history')
  getHistoryPrice(@Query('days') days?: string) {
    console.log('收到获取历史价格请求，天数:', days)
    const data = this.oilPriceService.getHistoryPrice(days ? parseInt(days) : 30)

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
