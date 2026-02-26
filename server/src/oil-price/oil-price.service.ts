import { Injectable } from '@nestjs/common'

export interface OilPrice {
  name: string
  price: number
  change: number
}

export interface NextAdjustment {
  date: string
  direction: 'up' | 'down' | 'stable'
  expectedChange: number
  daysRemaining: number
}

export interface PriceData {
  currentPrices: OilPrice[]
  nextAdjustment: NextAdjustment
  updateTime: string
  cityName: string
  provinceName: string
}

export interface HistoryPriceData {
  date: string
  gas92: number
  gas95: number
  gas98: number
  diesel0: number
  change: number
}

export interface CityData {
  name: string
  province: string
  gas92: number
  gas95: number
  gas98: number
  diesel0: number
  diff: number // 与全国均价的差异
}

// 城市数据
const CITIES = [
  { name: '北京', province: '北京市' },
  { name: '上海', province: '上海市' },
  { name: '广州', province: '广东省' },
  { name: '深圳', province: '广东省' },
  { name: '杭州', province: '浙江省' },
  { name: '南京', province: '江苏省' },
  { name: '成都', province: '四川省' },
  { name: '重庆', province: '重庆市' },
  { name: '武汉', province: '湖北省' },
  { name: '西安', province: '陕西省' },
]

@Injectable()
export class OilPriceService {
  // 全国均价（基准）
  private nationalAverage = {
    gas92: 7.89,
    gas95: 8.37,
    gas98: 9.13,
    diesel0: 7.56,
  }

  // 模拟各城市价格（基于全国均价加随机差异）
  private mockCityPrices: Record<string, { gas92: number; gas95: number; gas98: number; diesel0: number }> = {}

  // 模拟历史价格数据
  private mockHistoryData: HistoryPriceData[] = []

  constructor() {
    this.initializeCityPrices()
    this.generateHistoryData()
  }

  // 初始化城市价格
  private initializeCityPrices() {
    CITIES.forEach((city) => {
      // 每个城市的价格在基准价上下浮动 ±0.15
      this.mockCityPrices[city.name] = {
        gas92: this.nationalAverage.gas92 + (Math.random() - 0.5) * 0.3,
        gas95: this.nationalAverage.gas95 + (Math.random() - 0.5) * 0.3,
        gas98: this.nationalAverage.gas98 + (Math.random() - 0.5) * 0.3,
        diesel0: this.nationalAverage.diesel0 + (Math.random() - 0.5) * 0.3,
      }
    })
  }

  // 生成历史价格数据（最近90天）
  private generateHistoryData() {
    const today = new Date()
    const basePrice = this.nationalAverage.gas92

    for (let i = 0; i < 90; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)

      // 模拟价格波动
      const change = (Math.random() - 0.5) * 0.2
      const price = basePrice + change

      this.mockHistoryData.push({
        date: date.toISOString().split('T')[0],
        gas92: parseFloat(price.toFixed(2)),
        gas95: parseFloat((price * 1.06).toFixed(2)),
        gas98: parseFloat((price * 1.16).toFixed(2)),
        diesel0: parseFloat((price * 0.96).toFixed(2)),
        change: parseFloat(change.toFixed(3)),
      })
    }
  }

  // 获取指定城市的当前油价
  getCurrentPrices(city: string = '北京'): PriceData {
    const cityPrice = this.mockCityPrices[city] || this.mockCityPrices['北京']
    const cityInfo = CITIES.find((c) => c.name === city) || CITIES[0]

    // 计算涨跌（与上周相比）
    const currentPrices: OilPrice[] = [
      { name: '92号汽油', price: cityPrice.gas92, change: 0.15 },
      { name: '95号汽油', price: cityPrice.gas95, change: 0.16 },
      { name: '98号汽油', price: cityPrice.gas98, change: 0.17 },
      { name: '0号柴油', price: cityPrice.diesel0, change: 0.14 },
    ]

    // 计算更新时间
    const now = new Date()
    const updateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} 00:00`

    return {
      currentPrices,
      nextAdjustment: this.getMockNextAdjustment(),
      updateTime,
      cityName: cityInfo.name,
      provinceName: cityInfo.province,
    }
  }

  // 获取所有城市列表
  getCityList(): Array<{ name: string; province: string }> {
    return CITIES.map((city) => ({
      name: city.name,
      province: city.province,
    }))
  }

  // 获取所有城市的价格对比
  getAllCityPrices(): CityData[] {
    const avg92 = this.nationalAverage.gas92
    const avg95 = this.nationalAverage.gas95
    const avg98 = this.nationalAverage.gas98
    const avg0 = this.nationalAverage.diesel0

    return CITIES.map((city) => {
      const price = this.mockCityPrices[city.name]
      const diff = price.gas92 - avg92

      return {
        name: city.name,
        province: city.province,
        gas92: parseFloat(price.gas92.toFixed(2)),
        gas95: parseFloat(price.gas95.toFixed(2)),
        gas98: parseFloat(price.gas98.toFixed(2)),
        diesel0: parseFloat(price.diesel0.toFixed(2)),
        diff: parseFloat(diff.toFixed(3)),
      }
    }).sort((a, b) => a.gas92 - b.gas92) // 按价格排序
  }

  // 获取历史价格数据
  getHistoryPrice(days: number = 30): HistoryPriceData[] {
    return this.mockHistoryData.slice(0, days)
  }

  // 模拟下次调价信息
  private getMockNextAdjustment(): NextAdjustment {
    const now = new Date()
    const nextAdjustmentDate = new Date(now)
    nextAdjustmentDate.setDate(nextAdjustmentDate.getDate() + 5)

    return {
      date: nextAdjustmentDate.toISOString().split('T')[0],
      direction: Math.random() > 0.5 ? 'up' : 'down',
      expectedChange: Math.random() * 0.2,
      daysRemaining: 5,
    }
  }
}
