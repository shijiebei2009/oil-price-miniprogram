import { Controller, Post, Body, Get, Query, Logger } from '@nestjs/common'
import { WechatService } from './wechat.service'
import { getSupabaseClient } from '@/storage/database/supabase-client'

@Controller('wechat')
export class WechatController {
  private readonly logger = new Logger(WechatController.name)

  constructor(private readonly wechatService: WechatService) {}

  /**
   * 手动发送订阅消息（用于测试）
   */
  @Post('send-subscribe')
  async sendSubscribeMessage(@Body() body: {
    openid: string
    content: string
    price: number
    unit: string
    time: string
    type: string
  }) {
    const { openid, content, price, unit, time, type } = body

    try {
      const result = await this.wechatService.sendOilPriceAdjustmentNotice(
        openid,
        { content, price, unit, time, type }
      )

      if (result.errcode === 0) {
        return {
          code: 200,
          msg: '发送成功',
          data: { errcode: result.errcode, errmsg: result.errmsg }
        }
      } else {
        return {
          code: 500,
          msg: result.errmsg,
          data: { errcode: result.errcode, errmsg: result.errmsg }
        }
      }

      if (result.errcode === 0) {
        return {
          code: 200,
          msg: '发送成功',
          data: result
        }
      } else {
        return {
          code: 500,
          msg: result.errmsg,
          data: result
        }
      }
    } catch (error) {
      return {
        code: 500,
        msg: error.message || '发送失败',
        data: null
      }
    }
  }

  /**
   * 批量发送调价提醒给所有订阅用户
   */
  @Post('send-batch-notice')
  async sendBatchNotice(@Body() body: {
    scene: string // 'price_change' | 'price_alert'
    price: number
    unit: string
    time: string
    type: string
  }) {
    const { scene, price, unit, time, type } = body

    try {
      const client = getSupabaseClient()

      // 查询所有有效的订阅记录
      const { data: subscriptions, error } = await client
        .from('subscription_messages')
        .select('*')
        .eq('scene', scene)
        .gt('expires_at', new Date().toISOString())

      if (error) {
        throw new Error(`查询订阅记录失败: ${error.message}`)
      }

      if (!subscriptions || subscriptions.length === 0) {
        return {
          code: 200,
          msg: '没有有效的订阅记录',
          data: { sent: 0, failed: 0 }
        }
      }

      // 批量发送消息
      let sentCount = 0
      let failedCount = 0

      for (const sub of subscriptions) {
        try {
          await this.wechatService.sendOilPriceAdjustmentNotice(
            sub.openid,
            {
              content: `您关注的${sub.province}${sub.city}油价有变动`,
              price,
              unit,
              time,
              type
            }
          )
          sentCount++
        } catch (error) {
          failedCount++
          this.logger.error(`发送消息失败 (${sub.openid}):`, error.message)
        }
      }

      return {
        code: 200,
        msg: '批量发送完成',
        data: {
          sent: sentCount,
          failed: failedCount,
          total: subscriptions.length
        }
      }
    } catch (error) {
      return {
        code: 500,
        msg: error.message || '批量发送失败',
        data: null
      }
    }
  }

  /**
   * 获取 access_token（用于调试）
   */
  @Get('access-token')
  async getAccessToken() {
    try {
      const token = await this.wechatService['getAccessToken']()
      return {
        code: 200,
        msg: 'success',
        data: {
          access_token: token.substring(0, 20) + '...', // 只返回部分信息
          length: token.length
        }
      }
    } catch (error) {
      return {
        code: 500,
        msg: error.message || '获取失败',
        data: null
      }
    }
  }
}
