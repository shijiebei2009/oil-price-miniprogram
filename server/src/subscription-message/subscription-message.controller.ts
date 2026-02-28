import { Controller, Post, Get, Body, Query } from '@nestjs/common'
import { SubscriptionMessageService } from './subscription-message.service'

@Controller('subscription-message')
export class SubscriptionMessageController {
  constructor(
    private readonly subscriptionMessageService: SubscriptionMessageService,
  ) {}

  /**
   * 保存订阅记录
   */
  @Post()
  async saveSubscription(@Body() body: {
    openid: string
    templateId: string
    scene: string
    province?: string
    city?: string
    priceType?: string
    targetPrice?: any
  }) {
    const { openid, templateId, scene, province, city, priceType, targetPrice } = body

    // 计算过期时间（24小时后）
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    try {
      const data = await this.subscriptionMessageService.saveSubscription({
        openid,
        templateId,
        scene,
        province,
        city,
        priceType,
        targetPrice,
        expiresAt,
      })

      return {
        code: 200,
        msg: '订阅成功',
        data,
      }
    } catch (error) {
      return {
        code: 500,
        msg: error.message || '订阅失败',
        data: null,
      }
    }
  }

  /**
   * 查询用户的订阅记录
   */
  @Get()
  async getUserSubscriptions(@Query('openid') openid: string) {
    if (!openid) {
      return {
        code: 400,
        msg: '缺少 openid 参数',
        data: null,
      }
    }

    try {
      const data = await this.subscriptionMessageService.getUserSubscriptions(openid)

      return {
        code: 200,
        msg: 'success',
        data,
      }
    } catch (error) {
      return {
        code: 500,
        msg: error.message || '查询失败',
        data: null,
      }
    }
  }
}
