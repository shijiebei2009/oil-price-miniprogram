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
}

@Injectable()
export class OilPriceService {
  // 模拟数据 - 实际应用中应该从真实API获取
  private mockCurrentPrices: OilPrice[] = [
    { name: '92号汽油', price: 7.89, change: 0.15 },
    { name: '95号汽油', price: 8.37, change: 0.16 },
    { name: '98号汽油', price: 9.13, change: 0.17 },
    { name: '0号柴油', price: 7.56, change: 0.14 }
  ]

  private mockNextAdjustment: NextAdjustment = {
    date: '2024-12-19',
    direction: 'up',
    expectedChange: 0.12,
    daysRemaining: 5
  }

  getCurrentPrices(): PriceData {
    // 计算更新时间（当前时间）
    const now = new Date()
    const updateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} 00:00`

    console.log('返回油价数据:', {
      currentPrices: this.mockCurrentPrices,
      nextAdjustment: this.mockNextAdjustment,
      updateTime
    })

    return {
      currentPrices: this.mockCurrentPrices,
      nextAdjustment: this.mockNextAdjustment,
      updateTime
    }
  }
}
