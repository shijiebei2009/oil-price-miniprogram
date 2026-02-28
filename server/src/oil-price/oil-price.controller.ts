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

  // 获取当前油价（支持省份参数，新接口）
  @Get('province/current')
  getProvinceCurrentPrices(@Query('province') province?: string) {
    console.log('收到获取省份油价请求，省份:', province)
    const data = this.oilPriceService.getProvinceCurrentPrices(province)

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

  // 获取省份列表
  @Get('provinces')
  getProvinceList() {
    console.log('收到获取省份列表请求')
    const data = this.oilPriceService.getProvinceList()

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

  // 获取所有省份价格对比
  @Get('provinces/compare')
  getAllProvincePrices() {
    console.log('收到获取省份价格对比请求')
    const data = this.oilPriceService.getAllProvincePrices()

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

  // 获取历史价格（按调价次数查询）
  @Get('history')
  getHistoryPrice(@Query('count') count?: string) {
    console.log('收到获取历史价格请求，调价次数:', count)
    const data = this.oilPriceService.getHistoryPrice(count ? parseInt(count) : 10)

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
