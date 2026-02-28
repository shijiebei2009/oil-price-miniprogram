import { Injectable, Logger } from '@nestjs/common'
import axios from 'axios'
import { ConfigService } from '@nestjs/config'

export interface SendSubscribeMessageParams {
  touser: string // 用户的openid
  template_id: string // 订阅消息模板ID
  data: {
    thing2: { value: string } // 详细内容
    amount4: { value: string } // 当前价格
    thing9: { value: string } // 单位
    time11: { value: string } // 价格变动时间
    thing13: { value: string } // 提醒类型
  }
}

interface AccessTokenResponse {
  access_token: string
  expires_in: number
  errcode?: number
  errmsg?: string
}

interface SendSubscribeMessageResponse {
  errcode: number
  errmsg: string
}

@Injectable()
export class WechatService {
  private readonly logger = new Logger(WechatService.name)
  private accessToken: string | null = null
  private tokenExpireTime: number = 0

  constructor(private readonly configService: ConfigService) {}

  /**
   * 获取 access_token
   */
  private async getAccessToken(): Promise<string> {
    // 检查 token 是否有效
    const now = Date.now()
    if (this.accessToken && now < this.tokenExpireTime) {
      return this.accessToken
    }

    try {
      const appId = this.configService.get<string>('WECHAT_APPID')
      const appSecret = this.configService.get<string>('WECHAT_SECRET')

      if (!appId || !appSecret) {
        throw new Error('WECHAT_APPID 或 WECHAT_SECRET 未配置')
      }

      const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`
      const response = await axios.get<AccessTokenResponse>(url)

      if (response.data.errcode) {
        throw new Error(`获取 access_token 失败: ${response.data.errmsg}`)
      }

      this.accessToken = response.data.access_token
      // 提前 5 分钟过期，避免边界情况
      this.tokenExpireTime = now + (response.data.expires_in - 300) * 1000

      this.logger.log(`✅ 获取 access_token 成功`)
      return this.accessToken
    } catch (error) {
      this.logger.error('获取 access_token 失败:', error.message)
      throw error
    }
  }

  /**
   * 发送订阅消息
   */
  async sendSubscribeMessage(params: SendSubscribeMessageParams): Promise<SendSubscribeMessageResponse> {
    try {
      const accessToken = await this.getAccessToken()
      const url = `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`

      const response = await axios.post<SendSubscribeMessageResponse>(url, params)

      if (response.data.errcode !== 0) {
        this.logger.error(`发送订阅消息失败: ${response.data.errcode} - ${response.data.errmsg}`)
      } else {
        this.logger.log(`✅ 发送订阅消息成功: ${params.touser}`)
      }

      return response.data
    } catch (error) {
      this.logger.error('发送订阅消息异常:', error.message)
      throw error
    }
  }

  /**
   * 发送油价调价提醒
   */
  async sendOilPriceAdjustmentNotice(openid: string, data: {
    content: string
    price: number
    unit: string
    time: string
    type: string
  }): Promise<SendSubscribeMessageResponse> {
    const templateId = this.configService.get<string>('WECHAT_SUBSCRIBE_TEMPLATE_ID')

    if (!templateId) {
      throw new Error('WECHAT_SUBSCRIBE_TEMPLATE_ID 未配置')
    }

    const params: SendSubscribeMessageParams = {
      touser: openid,
      template_id: templateId,
      data: {
        thing2: { value: data.content },
        amount4: { value: data.price.toFixed(2) },
        thing9: { value: data.unit },
        time11: { value: data.time },
        thing13: { value: data.type }
      }
    }

    return this.sendSubscribeMessage(params)
  }
}
