import { Injectable, Logger } from '@nestjs/common'

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
  trend: string // 趋势描述
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
  { name: '天津', province: '天津市' },
  { name: '苏州', province: '江苏省' },
  { name: '长沙', province: '湖南省' },
  { name: '郑州', province: '河南省' },
  { name: '青岛', province: '山东省' },
  { name: '东莞', province: '广东省' },
  { name: '宁波', province: '浙江省' },
  { name: '佛山', province: '广东省' },
  { name: '合肥', province: '安徽省' },
  { name: '济南', province: '山东省' },
  { name: '福州', province: '福建省' },
  { name: '厦门', province: '福建省' },
  { name: '大连', province: '辽宁省' },
  { name: '沈阳', province: '辽宁省' },
  { name: '长春', province: '吉林省' },
  { name: '哈尔滨', province: '黑龙江省' },
  { name: '石家庄', province: '河北省' },
  { name: '太原', province: '山西省' },
  { name: '南昌', province: '江西省' },
  { name: '南宁', province: '广西壮族自治区' },
  { name: '海口', province: '海南省' },
  { name: '贵阳', province: '贵州省' },
  { name: '昆明', province: '云南省' },
  { name: '兰州', province: '甘肃省' },
  { name: '银川', province: '宁夏回族自治区' },
  { name: '西宁', province: '青海省' },
  { name: '乌鲁木齐', province: '新疆维吾尔自治区' },
  { name: '拉萨', province: '西藏自治区' },
  { name: '呼和浩特', province: '内蒙古自治区' },
  { name: '唐山', province: '河北省' },
  { name: '淄博', province: '山东省' },
  { name: '烟台', province: '山东省' },
  { name: '威海', province: '山东省' },
  { name: '常州', province: '江苏省' },
  { name: '徐州', province: '江苏省' },
  { name: '南通', province: '江苏省' },
  { name: '无锡', province: '江苏省' },
  { name: '绍兴', province: '浙江省' },
  { name: '金华', province: '浙江省' },
  { name: '台州', province: '浙江省' },
  { name: '温州', province: '浙江省' },
  { name: '湖州', province: '浙江省' },
  { name: '珠海', province: '广东省' },
  { name: '惠州', province: '广东省' },
  { name: '中山', province: '广东省' },
  { name: '江门', province: '广东省' },
  { name: '汕头', province: '广东省' },
  { name: '潮州', province: '广东省' },
  { name: '遵义', province: '贵州省' },
  { name: '绵阳', province: '四川省' },
  { name: '德阳', province: '四川省' },
  { name: '南充', province: '四川省' },
  { name: '宜宾', province: '四川省' },
  { name: '泸州', province: '四川省' },
  { name: '宜昌', province: '湖北省' },
  { name: '襄阳', province: '湖北省' },
  { name: '荆州', province: '湖北省' },
  { name: '岳阳', province: '湖南省' },
  { name: '株洲', province: '湖南省' },
  { name: '湘潭', province: '湖南省' },
  { name: '衡阳', province: '湖南省' },
  { name: '洛阳', province: '河南省' },
  { name: '开封', province: '河南省' },
  { name: '安阳', province: '河南省' },
  { name: '新乡', province: '河南省' },
  { name: '南阳', province: '河南省' },
  { name: '宝鸡', province: '陕西省' },
  { name: '咸阳', province: '陕西省' },
  { name: '渭南', province: '陕西省' },
]

@Injectable()
export class OilPriceService {
  private readonly logger = new Logger(OilPriceService.name)

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

  // 数据缓存
  private dataCache: {
    lastUpdate: Date
    validUntil: Date
  } = {
    lastUpdate: new Date(),
    validUntil: new Date(Date.now() + 3600000), // 1小时后过期
  }

  constructor() {
    this.initializeCityPrices()
    this.generateHistoryData()
    this.logger.log('油价服务初始化完成')
  }

  // 检查数据是否需要更新
  private shouldRefreshData(): boolean {
    const now = new Date()
    return now > this.dataCache.validUntil
  }

  // 刷新数据
  private refreshData() {
    if (this.shouldRefreshData()) {
      this.initializeCityPrices()
      this.generateHistoryData()
      this.dataCache.lastUpdate = new Date()
      this.dataCache.validUntil = new Date(Date.now() + 3600000)
      this.logger.log('油价数据已刷新')
    }
  }

  // 初始化城市价格（更真实的模拟）
  private initializeCityPrices() {
    CITIES.forEach((city) => {
      // 根据城市特点生成更真实的价格差异
      let baseModifier = 0

      // 一线城市价格略高
      if (['北京', '上海', '深圳', '广州'].includes(city.name)) {
        baseModifier = 0.05
      }

      this.mockCityPrices[city.name] = {
        gas92: this.nationalAverage.gas92 + baseModifier + (Math.random() - 0.5) * 0.2,
        gas95: this.nationalAverage.gas95 + baseModifier + (Math.random() - 0.5) * 0.2,
        gas98: this.nationalAverage.gas98 + baseModifier + (Math.random() - 0.5) * 0.2,
        diesel0: this.nationalAverage.diesel0 + baseModifier + (Math.random() - 0.5) * 0.2,
      }
    })
  }

  // 生成历史价格数据（最近180天，更真实的波动）
  private generateHistoryData() {
    this.mockHistoryData = []

    const today = new Date()
    const basePrice = this.nationalAverage.gas92
    let currentPrice = basePrice

    // 从180天前开始生成
    for (let i = 179; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)

      // 模拟调价周期（每10个工作日调整一次，约14-15天）
      const dayOfWeek = date.getDay()
      const isWorkday = dayOfWeek !== 0 && dayOfWeek !== 6

      if (isWorkday && i % 14 === 0) {
        // 调价日，价格波动较大
        const adjustment = (Math.random() - 0.45) * 0.25 // 略微倾向于上涨
        currentPrice += adjustment
      } else {
        // 非调价日，价格小幅波动
        currentPrice += (Math.random() - 0.5) * 0.02
      }

      // 确保价格在合理范围内
      currentPrice = Math.max(6.5, Math.min(9.5, currentPrice))

      const price92 = currentPrice
      const price95 = currentPrice * 1.06
      const price98 = currentPrice * 1.16
      const price0 = currentPrice * 0.96

      // 计算与前一天的涨跌
      const prevData = this.mockHistoryData[this.mockHistoryData.length - 1]
      const change = prevData ? price92 - prevData.gas92 : 0

      this.mockHistoryData.push({
        date: date.toISOString().split('T')[0],
        gas92: parseFloat(price92.toFixed(2)),
        gas95: parseFloat(price95.toFixed(2)),
        gas98: parseFloat(price98.toFixed(2)),
        diesel0: parseFloat(price0.toFixed(2)),
        change: parseFloat(change.toFixed(3)),
      })
    }
  }

  // 获取指定城市的当前油价
  getCurrentPrices(city: string = '北京'): PriceData {
    this.refreshData()

    const cityPrice = this.mockCityPrices[city] || this.mockCityPrices['北京']
    const cityInfo = CITIES.find((c) => c.name === city) || CITIES[0]

    // 获取最新的历史数据作为参考
    const latestHistory = this.mockHistoryData[0]
    const previousHistory = this.mockHistoryData[1]

    // 计算涨跌（与上一周期相比）
    const currentPrices: OilPrice[] = [
      {
        name: '92号汽油',
        price: cityPrice.gas92,
        change: latestHistory ? latestHistory.change : 0
      },
      {
        name: '95号汽油',
        price: cityPrice.gas95,
        change: latestHistory ? latestHistory.change * 1.06 : 0
      },
      {
        name: '98号汽油',
        price: cityPrice.gas98,
        change: latestHistory ? latestHistory.change * 1.16 : 0
      },
      {
        name: '0号柴油',
        price: cityPrice.diesel0,
        change: latestHistory ? latestHistory.change * 0.96 : 0
      },
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
    this.refreshData()

    return CITIES.map((city) => ({
      name: city.name,
      province: city.province,
    }))
  }

  // 获取所有城市的价格对比
  getAllCityPrices(): CityData[] {
    this.refreshData()

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
    this.refreshData()

    // 限制最大查询天数
    const maxDays = 180
    const queryDays = Math.min(Math.max(1, days), maxDays)

    return this.mockHistoryData.slice(0, queryDays)
  }

  // 模拟下次调价信息（更智能的预测）
  private getMockNextAdjustment(): NextAdjustment {
    const now = new Date()
    const nextAdjustmentDate = new Date(now)

    // 根据最近的历史数据预测趋势
    const recentChanges = this.mockHistoryData.slice(0, 7).map(d => d.change)
    const avgChange = recentChanges.reduce((sum, c) => sum + c, 0) / recentChanges.length

    // 设置下次调价日期（14天后）
    nextAdjustmentDate.setDate(nextAdjustmentDate.getDate() + 14)

    // 根据趋势预测方向
    let direction: 'up' | 'down' | 'stable'
    let trend: string

    if (avgChange > 0.01) {
      direction = 'up'
      trend = '国际原油价格持续上涨'
    } else if (avgChange < -0.01) {
      direction = 'down'
      trend = '国际原油价格有所回落'
    } else {
      direction = 'stable'
      trend = '国际原油价格保持稳定'
    }

    // 预期变化幅度
    const expectedChange = Math.abs(avgChange) * 5 // 放大预测幅度

    return {
      date: nextAdjustmentDate.toISOString().split('T')[0],
      direction,
      expectedChange: parseFloat(expectedChange.toFixed(3)),
      daysRemaining: 14,
      trend,
    }
  }

  // TODO: 接入真实 API 的预留接口
  // async fetchFromRealAPI(city: string): Promise<PriceData> {
  //   // 接入真实油价 API 的逻辑
  //   // 例如：天行数据、聚合数据、易源数据等
  //   throw new Error('真实 API 接口尚未配置')
  // }
}
