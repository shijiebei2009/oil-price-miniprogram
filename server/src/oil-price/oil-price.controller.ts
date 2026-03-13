import { Controller, Get, Query } from '@nestjs/common'
import { OilPriceService } from './oil-price.service'
import { Public } from '@/auth/decorators'

@Controller('oil-price')
@Public()
export class OilPriceController {
  constructor(private readonly oilPriceService: OilPriceService) {}

  // 获取当前油价（支持省份和城市参数）
  @Get('current')
  async getCurrentPrices(@Query('province') province?: string, @Query('city') city?: string) {
    console.log('收到获取当前油价请求，省份:', province, '城市:', city)
    const data = await this.oilPriceService.getCurrentPrice(province || '北京市', city || '北京')

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

  // 获取所有省份价格对比
  @Get('provinces/compare')
  async getAllProvincePrices() {
    console.log('收到获取省份价格对比请求')
    const data = await this.oilPriceService.getProvinceCurrentPrices()

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
  async getAllCityPrices() {
    console.log('收到获取城市价格对比请求')
    const data = await this.oilPriceService.getCityCurrentPrices()

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

  // 获取历史价格（按省份和城市查询）
  @Get('history')
  async getHistoryPrice(@Query('province') province?: string, @Query('city') city?: string) {
    console.log('收到获取历史价格请求，省份:', province, '城市:', city)
    const data = await this.oilPriceService.getHistoryPrice(province, city)

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

  // 获取调价日历
  @Get('adjustment-calendar')
  async getAdjustmentCalendar(@Query('year') year?: string) {
    console.log('收到获取调价日历请求，年份:', year)
    const data = await this.oilPriceService.getAdjustmentCalendar(year ? parseInt(year) : undefined)

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
