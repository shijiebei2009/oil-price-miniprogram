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
  expiresAt: Date  // 🔧 保留为 Date，但可以使用很远的未来时间（2030-01-01）来表示长期订阅意向
}

@Injectable()
export class SubscriptionMessageService {
  private readonly logger = new Logger(SubscriptionMessageService.name)

  /**
   * 保存订阅记录（含去重逻辑）
   */
  async saveSubscription(input: SubscriptionMessageInput) {
    try {
      const client = getSupabaseClient()

      // 🔧 去重逻辑：先删除相同条件的旧订阅
      // 使用 openid + scene + province + city 作为唯一性判断
      const { error: deleteError } = await client
        .from('subscription_messages')
        .delete()
        .eq('openid', input.openid)
        .eq('scene', input.scene)
        .eq('province', input.province || null)
        .eq('city', input.city || null)

      if (deleteError) {
        this.logger.warn('删除旧订阅记录失败（继续插入新记录）:', deleteError.message)
      } else {
        this.logger.log(`✅ 已删除旧订阅记录: ${input.openid}, scene: ${input.scene}`)
      }

      // 插入新订阅
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
          expires_at: input.expiresAt.toISOString(),  // 🔧 设置为很远的未来时间（2030-01-01）
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

  /**
   * 清理重复的订阅记录（保留每个组合的最新记录）
   * 使用 openid + scene + province + city 作为唯一性判断
   */
  async cleanDuplicateSubscriptions() {
    try {
      const client = getSupabaseClient()

      // 1. 先查询重复的订阅记录
      const { data: duplicates, error: queryError } = await client
        .rpc('get_duplicate_subscriptions')

      if (queryError) {
        // 如果函数不存在，使用 SQL 方式
        this.logger.warn('使用 SQL 方式清理重复订阅')
        return await this.cleanDuplicateSubscriptionsBySQL()
      }

      const duplicateCount = duplicates?.length || 0

      if (duplicateCount === 0) {
        this.logger.log('✅ 没有发现重复订阅记录')
        return {
          deletedCount: 0,
          remainingCount: 0
        }
      }

      // 2. 删除重复的订阅记录（保留最新的）
      const { data: deleted, error: deleteError } = await client
        .rpc('delete_duplicate_subscriptions')

      if (deleteError) {
        this.logger.error('清理重复订阅记录失败:', deleteError.message)
        throw new Error(`清理重复订阅记录失败: ${deleteError.message}`)
      }

      const deletedCount = deleted?.length || 0

      // 3. 查询清理后的总记录数
      const { count: remainingCount, error: countError } = await client
        .from('subscription_messages')
        .select('*', { count: 'exact', head: true })

      if (countError) {
        this.logger.warn('查询剩余记录数失败:', countError.message)
      }

      this.logger.log(`✅ 已清理 ${deletedCount} 条重复订阅记录，剩余 ${remainingCount || 0} 条`)

      return {
        deletedCount,
        remainingCount: remainingCount || 0
      }
    } catch (error) {
      this.logger.error('清理重复订阅记录异常:', error)
      throw error
    }
  }

  /**
   * 使用 SQL 方式清理重复订阅（备用方案）
   */
  private async cleanDuplicateSubscriptionsBySQL() {
    try {
      const client = getSupabaseClient()

      // 查询重复记录
      const { data: allRecords, error: queryError } = await client
        .from('subscription_messages')
        .select('*')
        .order('created_at', { ascending: false })

      if (queryError) {
        throw new Error(`查询订阅记录失败: ${queryError.message}`)
      }

      // 使用 Map 去重，保留每个组合的最新记录
      const uniqueMap = new Map()
      const duplicatesToDelete: string[] = []

      for (const record of allRecords || []) {
        const key = `${record.openid}_${record.scene}_${record.province}_${record.city}`
        if (uniqueMap.has(key)) {
          // 已存在，标记为重复
          duplicatesToDelete.push(record.id)
        } else {
          // 首次出现，保留
          uniqueMap.set(key, record.id)
        }
      }

      if (duplicatesToDelete.length === 0) {
        this.logger.log('✅ 没有发现重复订阅记录')
        return {
          deletedCount: 0,
          remainingCount: allRecords?.length || 0
        }
      }

      // 删除重复记录
      const { data: deleted, error: deleteError } = await client
        .from('subscription_messages')
        .delete()
        .in('id', duplicatesToDelete)
        .select()

      if (deleteError) {
        throw new Error(`删除重复记录失败: ${deleteError.message}`)
      }

      const deletedCount = deleted?.length || 0
      const remainingCount = (allRecords?.length || 0) - deletedCount

      this.logger.log(`✅ 已清理 ${deletedCount} 条重复订阅记录，剩余 ${remainingCount} 条`)

      return {
        deletedCount,
        remainingCount
      }
    } catch (error) {
      this.logger.error('SQL 方式清理重复订阅记录异常:', error)
      throw error
    }
  }

  /**
   * 清空所有订阅记录（危险操作，仅限管理员）
   */
  async clearAllSubscriptions() {
    try {
      const client = getSupabaseClient()

      // 先查询总记录数
      const { count: totalCount, error: countError } = await client
        .from('subscription_messages')
        .select('*', { count: 'exact', head: true })

      if (countError) {
        throw new Error(`查询订阅记录数失败: ${countError.message}`)
      }

      // 删除所有记录
      const { error: deleteError } = await client
        .from('subscription_messages')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // 删除所有记录

      if (deleteError) {
        throw new Error(`清空订阅记录失败: ${deleteError.message}`)
      }

      this.logger.log(`✅ 已清空所有订阅记录，共 ${totalCount} 条`)

      return {
        deletedCount: totalCount || 0
      }
    } catch (error) {
      this.logger.error('清空所有订阅记录异常:', error)
      throw error
    }
  }
}
