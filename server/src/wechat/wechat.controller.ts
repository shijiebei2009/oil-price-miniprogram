import { Controller, Post, Body, Get, Query, Logger } from '@nestjs/common'
import { WechatService } from './wechat.service'
import { getSupabaseClient } from '@/storage/database/supabase-client'
import { Public } from '@/auth/decorators'

@Controller('wechat')
export class WechatController {
  private readonly logger = new Logger(WechatController.name)

  constructor(private readonly wechatService: WechatService) {}

  /**
   * 微信登录：用 code 换取 openid
   */
  @Public()
  @Post('login')
  async login(@Body() body: { code: string }) {
    const { code } = body

    try {
      const result = await this.wechatService.login(code)

      return {
        code: 200,
        msg: 'success',
        data: result
      }
    } catch (error) {
      this.logger.error('登录失败:', error.message)

      return {
        code: 500,
        msg: error.message || '登录失败',
        data: null
      }
    }
  }

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

      // 🔧 方案1：移除过期时间过滤，查询所有订阅记录
      const { data: subscriptions, error } = await client
        .from('subscription_messages')
        .select('*')
        .eq('scene', scene)
        // .gt('expires_at', new Date().toISOString())  // ❌ 移除此过滤

      if (error) {
        throw new Error(`查询订阅记录失败: ${error.message}`)
      }

      if (!subscriptions || subscriptions.length === 0) {
        return {
          code: 200,
          msg: '没有订阅记录',
          data: { sent: 0, failed: 0, needReauth: 0 }
        }
      }

      // 批量发送消息
      let sentCount = 0
      let failedCount = 0
      let needReauthCount = 0
      const needReauthOpenids: string[] = []

      for (const sub of subscriptions) {
        try {
          const result = await this.wechatService.sendOilPriceAdjustmentNotice(
            sub.openid,
            {
              content: `您关注的${sub.province}${sub.city}油价有变动`,
              price,
              unit,
              time,
              type
            }
          )

          // 🔧 检查授权是否过期
          if (result.errcode === 43101) {
            // 授权已过期，需要重新授权
            needReauthCount++
            needReauthOpenids.push(sub.openid)
            this.logger.warn(`用户 ${sub.openid} 授权已过期，需要重新授权`)
          } else if (result.errcode === 0) {
            // 发送成功
            sentCount++
          } else {
            // 其他错误
            failedCount++
            this.logger.error(`发送消息失败 (${sub.openid}): ${result.errmsg}`)
          }
        } catch (error) {
          failedCount++
          this.logger.error(`发送消息异常 (${sub.openid}):`, error.message)
        }
      }

      return {
        code: 200,
        msg: '批量发送完成',
        data: {
          sent: sentCount,
          failed: failedCount,
          needReauth: needReauthCount,
          needReauthOpenids,
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
