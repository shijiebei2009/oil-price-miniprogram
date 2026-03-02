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

    // 🔧 方案1：设置过期时间为一个很远的未来时间（2030-01-01）
    // 这样可以避免修改数据库 schema，同时实现长期订阅意向
    const expiresAt = new Date('2030-01-01T00:00:00.000Z')

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

  /**
   * 清理重复的订阅记录
   * POST /api/subscription-message/clean-duplicates
   */
  @Post('clean-duplicates')
  async cleanDuplicateSubscriptions() {
    try {
      const result = await this.subscriptionMessageService.cleanDuplicateSubscriptions()

      return {
        code: 200,
        msg: '清理成功',
        data: {
          deletedCount: result.deletedCount,
          remainingCount: result.remainingCount,
          message: `已清理 ${result.deletedCount} 条重复订阅记录，剩余 ${result.remainingCount} 条订阅记录`
        }
      }
    } catch (error) {
      return {
        code: 500,
        msg: error.message || '清理失败',
        data: null,
      }
    }
  }

  /**
   * 清空所有订阅记录（危险操作，仅限管理员）
   * POST /api/subscription-message/clear-all
   */
  @Post('clear-all')
  async clearAllSubscriptions() {
    try {
      const result = await this.subscriptionMessageService.clearAllSubscriptions()

      return {
        code: 200,
        msg: '清空成功',
        data: {
          deletedCount: result.deletedCount,
          message: `已清空所有订阅记录，共 ${result.deletedCount} 条`
        }
      }
    } catch (error) {
      return {
        code: 500,
        msg: error.message || '清空失败',
        data: null,
      }
    }
  }
}
