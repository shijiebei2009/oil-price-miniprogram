import { Injectable, Logger } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

export interface SubscriptionMessageInput {
  openid: string
  templateId: string
  scene: string
  province?: string
  city?: string
  priceType?: string
  targetPrice?: any
  expiresAt: Date
}

@Injectable()
export class SubscriptionMessageService {
  private readonly logger = new Logger(SubscriptionMessageService.name)

  /**
   * 保存订阅记录
   */
  async saveSubscription(input: SubscriptionMessageInput) {
    try {
      const client = getSupabaseClient()

      const { data, error } = await client
        .from('subscription_messages')
        .insert({
          openid: input.openid,
          template_id: input.templateId,
          scene: input.scene,
          province: input.province || null,
          city: input.city || null,
          price_type: input.priceType || null,
          target_price: input.targetPrice || null,
          expires_at: input.expiresAt.toISOString(),
        })
        .select()
        .single()

      if (error) {
        this.logger.error('保存订阅记录失败:', error.message)
        throw new Error(`保存订阅记录失败: ${error.message}`)
      }

      this.logger.log(`✅ 订阅记录已保存: ${input.openid}, scene: ${input.scene}`)
      return data
    } catch (error) {
      this.logger.error('保存订阅记录异常:', error)
      throw error
    }
  }

  /**
   * 查询用户的订阅记录
   */
  async getUserSubscriptions(openid: string) {
    try {
      const client = getSupabaseClient()

      const { data, error } = await client
        .from('subscription_messages')
        .select('*')
        .eq('openid', openid)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        this.logger.error('查询订阅记录失败:', error.message)
        throw new Error(`查询订阅记录失败: ${error.message}`)
      }

      return data || []
    } catch (error) {
      this.logger.error('查询订阅记录异常:', error)
      throw error
    }
  }

  /**
   * 清理过期的订阅记录
   */
  async cleanExpiredSubscriptions() {
    try {
      const client = getSupabaseClient()
      const now = new Date().toISOString()

      const { data, error } = await client
        .from('subscription_messages')
        .delete()
        .lt('expires_at', now)
        .select()

      if (error) {
        this.logger.error('清理过期订阅记录失败:', error.message)
        return 0
      }

      const count = data?.length || 0
      if (count > 0) {
        this.logger.log(`✅ 已清理 ${count} 条过期订阅记录`)
      }

      return count
    } catch (error) {
      this.logger.error('清理过期订阅记录异常:', error)
      return 0
    }
  }
}
