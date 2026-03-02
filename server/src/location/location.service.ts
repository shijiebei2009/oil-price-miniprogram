import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import axios from 'axios'
import * as fs from 'fs/promises'
import * as path from 'path'

export interface LocationResponse {
  status: number
  message: string
  result: {
    location: {
      lat: number
      lng: number
    }
    address: string
    address_component: {
      nation: string
      province: string
      city: string
      district: string
      street: string
      street_number: string
    }
    formatted_addresses: {
      recommend: string
      rough: string
    }
  }
}

interface LocationCacheEntry {
  lat: number
  lng: number
  cityName: string
  provinceName: string
  cachedAt: string
  expiresAt: string
}

interface LocationCache {
  [key: string]: LocationCacheEntry
}

@Injectable()
export class LocationService implements OnModuleInit {
  private readonly logger = new Logger(LocationService.name)
  private readonly apiKey = process.env.AMAP_API_KEY
  private readonly baseUrl = 'https://restapi.amap.com/v3/geocode/regeo'
  private readonly cacheFilePath = path.join(process.cwd(), 'data', 'location-cache.json')

  /**
   * 缓存时长：7天
   * 说明：城市信息很少变化，7天缓存可以大幅减少 API 调用
   * 注意：缓存过期时间是创建时间 + 7天，用户访问时间是随机的，所以过期时间自然也是随机的
   */
  private readonly cacheDuration = 7 * 24 * 60 * 60 * 1000 // 7天

  /**
   * 距离阈值：20公里
   * 说明：如果用户位置与缓存位置距离在20公里内，直接使用缓存
   *
   * 评估依据：
   * 1. 城市面积差异：大城市（北京140km、上海90km）vs 小城市（深圳50km）
   * 2. 油价格局：同一城市内的油价是统一的，跨城市才有差异
   * 3. 覆盖范围：20公里可以覆盖一个城市的大部分区域
   * 4. 避免跨城市：大部分城市间距离 > 50公里，20公里不会误判
   *
   * 特例说明：
   * - 广州 ↔ 佛山：约25公里（可能跨城市，但油价可能相近）
   * - 上海 ↔ 苏州：约85公里（不会跨城市）
   * - 北京 ↔ 天津：约120公里（不会跨城市）
   */
  private readonly distanceThreshold = 20 // 20公里

  private cacheData: LocationCache = {}

  constructor() {
    if (!this.apiKey) {
      this.logger.warn('⚠️ 高德地图 API Key 未配置，位置服务将不可用')
    }
  }

  async onModuleInit() {
    try {
      await this.loadCache()
      this.logger.log('✅ 位置缓存已加载')
    } catch (error) {
      this.logger.warn('⚠️ 加载位置缓存失败，将创建新缓存')
      this.cacheData = {}
    }
  }

  /**
   * 使用 Haversine 公式计算两个经纬度之间的距离（单位：公里）
   * @param lat1 第一个点的纬度
   * @param lng1 第一个点的经度
   * @param lat2 第二个点的纬度
   * @param lng2 第二个点的经度
   * @returns 距离（公里）
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371 // 地球半径（公里）
    const dLat = this.toRadians(lat2 - lat1)
    const dLng = this.toRadians(lng2 - lng1)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c

    return distance
  }

  /**
   * 将角度转换为弧度
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  /**
   * 生成缓存 key（使用坐标）
   * 说明：使用经纬度作为缓存Key，保留2位小数（约1公里精度）
   * 
   * 为什么用2位小数而不是4位小数？
   * - 4位小数（10米精度）：同一城市内会产生大量重复缓存
   * - 2位小数（1公里精度）：精度对城市级定位已足够，大幅减少缓存数据量
   * - 距离算法会处理精度问题：即使Key不同，距离<20km也能命中缓存
   * 
   * 示例：北京（140km × 140km）
   * - 4位小数：约196个缓存（140/10 × 140/10）❌
   * - 2位小数：约14个缓存（140/1 × 140/1）✅ 减少93%
   */
  private generateCacheKey(lat: number, lng: number): string {
    return `${lat.toFixed(2)},${lng.toFixed(2)}`
  }

  /**
   * 查找附近的缓存（距离<20km）
   *
   * 优化说明：
   * - 遍历所有缓存，计算距离
   * - 找到第一个距离<20km的缓存就返回（不需要找最近的）
   * - 因为同一城市的油价格局相同，距离远近不影响结果
   *
   * 性能考虑：
   * - 如果有 300 个城市缓存，最多计算 300 次距离
   * - 每次距离计算都是简单的数学运算，性能消耗很小
   * - 可以接受，因为大多数情况下会很快找到附近缓存
   *
   * @param lat 用户纬度
   * @param lng 用户经度
   * @returns 附近的缓存（如果距离在阈值内）
   */
  private findNearbyCache(lat: number, lng: number): LocationCacheEntry | null {
    for (const cacheEntry of Object.values(this.cacheData)) {
      // 检查缓存是否过期
      if (new Date(cacheEntry.expiresAt) <= new Date()) {
        continue
      }

      // 计算距离
      const distance = this.calculateDistance(lat, lng, cacheEntry.lat, cacheEntry.lng)

      // 如果距离在阈值内，直接返回（不需要找最近的）
      if (distance < this.distanceThreshold) {
        this.logger.log(`✅ 命中附近缓存: ${cacheEntry.cityName}，距离 ${distance.toFixed(2)} 公里`)
        return cacheEntry
      }
    }

    return null
  }

  /**
   * 加载缓存数据
   */
  private async loadCache(): Promise<void> {
    try {
      const data = await fs.readFile(this.cacheFilePath, 'utf-8')
      this.cacheData = JSON.parse(data)

      // 清理过期缓存
      const now = new Date().toISOString()
      const validEntries: LocationCache = {}

      for (const [key, entry] of Object.entries(this.cacheData)) {
        if (entry.expiresAt > now) {
          validEntries[key] = entry
        }
      }

      if (Object.keys(validEntries).length !== Object.keys(this.cacheData).length) {
        this.logger.log(`🧹 清理了 ${Object.keys(this.cacheData).length - Object.keys(validEntries).length} 条过期缓存`)
        this.cacheData = validEntries
        await this.saveCache()
      }

      this.logger.log(`✅ 已加载 ${Object.keys(this.cacheData).length} 条有效缓存`)
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.logger.log('📁 缓存文件不存在，将创建新文件')
      } else {
        this.logger.error('加载缓存失败:', error.message)
      }
      this.cacheData = {}
    }
  }

  /**
   * 保存缓存数据
   */
  private async saveCache(): Promise<void> {
    try {
      const dataDir = path.dirname(this.cacheFilePath)
      await fs.mkdir(dataDir, { recursive: true })
      await fs.writeFile(this.cacheFilePath, JSON.stringify(this.cacheData, null, 2), 'utf-8')
    } catch (error) {
      this.logger.error('保存缓存失败:', error.message)
    }
  }

  /**
   * 逆地理编码：根据经纬度获取地址信息（使用高德地图）
   *
   * 查询流程：
   * 1. 先查找附近缓存（距离<20km），找到则直接返回
   * 2. 如果没找到，调用高德地图API获取城市名称
   * 3. 保存到缓存（使用坐标作为Key）
   *
   * 高德地图 API 说明：
   * - URL: https://restapi.amap.com/v3/geocode/regeo
   * - 坐标顺序: lng,lat（经度在前，纬度在后）
   * - status = "1" 表示成功
   * - 城市格式: 直辖市时 city 字段为空数组 []，其他情况为字符串
   *
   * @param lat 纬度
   * @param lng 经度
   * @returns 地址信息
   */
  async reverseGeocode(lat: number, lng: number): Promise<LocationResponse> {
    if (!this.apiKey) {
      throw new Error('高德地图 API Key 未配置')
    }

    // 1. 先查找附近缓存（距离<20km）
    const nearbyCache = this.findNearbyCache(lat, lng)
    if (nearbyCache) {
      return this.buildResponseFromCache(nearbyCache)
    }

    // 2. 附近缓存未命中，调用高德地图 API
    try {
      // 注意：高德地图坐标顺序为 lng,lat（经度在前）
      const url = `${this.baseUrl}?location=${lng},${lat}&key=${this.apiKey}&output=json&extensions=all`
      this.logger.log(`🔍 调用高德地图逆地理编码 API: lat=${lat}, lng=${lng}`)

      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      const data = response.data

      // 高德地图返回 status = "1" 表示成功
      if (data.status !== '1') {
        this.logger.error(`高德地图 API 返回错误: ${data.info} (infocode: ${data.infocode})`)
        throw new Error(`高德地图 API 错误: ${data.info}`)
      }

      // 3. 保存到缓存（使用坐标作为Key）
      const cityName = this.extractCityName(data)
      const provinceName = data.regeocode.addressComponent.province.replace('省', '').replace('市', '')
      const cacheKey = this.generateCacheKey(lat, lng)

      this.cacheData[cacheKey] = {
        lat,
        lng,
        cityName,
        provinceName,
        cachedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + this.cacheDuration).toISOString()
      }

      await this.saveCache()

      this.logger.log(`✅ 逆地理编码成功: ${cityName}（已缓存，7天后过期）`)

      // 将高德地图响应格式转换为标准格式
      return this.buildResponseFromAmap(data)
    } catch (error) {
      this.logger.error('逆地理编码失败:', error.message)
      throw new Error(`获取位置信息失败: ${error.message}`)
    }
  }

  /**
   * 将高德地图响应格式转换为标准格式
   */
  private buildResponseFromAmap(amapResponse: any): LocationResponse {
    const component = amapResponse.regeocode.addressComponent

    return {
      status: 0,
      message: 'query ok',
      result: {
        location: {
          lat: 0, // 缓存中已有
          lng: 0
        },
        address: amapResponse.regeocode.formatted_address,
        address_component: {
          nation: component.country || '中国',
          province: component.province || '',
          city: Array.isArray(component.city) ? '' : component.city,
          district: component.district || '',
          street: component.township || '',
          street_number: ''
        },
        formatted_addresses: {
          recommend: amapResponse.regeocode.formatted_address,
          rough: `${component.province || ''}${Array.isArray(component.city) ? '' : component.city}`
        }
      }
    }
  }

  /**
   * 从缓存构建响应数据
   */
  private buildResponseFromCache(entry: LocationCacheEntry): LocationResponse {
    return {
      status: 0,
      message: 'query ok',
      result: {
        location: {
          lat: entry.lat,
          lng: entry.lng
        },
        address: `${entry.provinceName}${entry.cityName}`,
        address_component: {
          nation: '中国',
          province: entry.provinceName,
          city: entry.cityName,
          district: '',
          street: '',
          street_number: ''
        },
        formatted_addresses: {
          recommend: `${entry.provinceName}${entry.cityName}`,
          rough: `${entry.provinceName}${entry.cityName}`
        }
      }
    }
  }

  /**
   * 从地址信息中提取城市名称
   * @param amapResponse 高德地图返回的地址信息
   * @returns 城市名称
   */
  extractCityName(amapResponse: any): string {
    const component = amapResponse.regeocode.addressComponent
    let cityName = component.city

    // 处理直辖市（city 字段为空数组）
    if (!cityName || Array.isArray(cityName) || cityName === '') {
      // 如果 city 为空数组，使用 province（直辖市的情况）
      cityName = component.province.replace('市', '')
    } else {
      // 去掉"市"字
      cityName = cityName.replace('市', '')
    }

    return cityName
  }

  /**
   * 清空缓存（用于测试）
   */
  async clearCache(): Promise<void> {
    this.cacheData = {}
    await this.saveCache()
    this.logger.log('🗑️ 缓存已清空')
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats() {
    const now = new Date()
    const validEntries = Object.values(this.cacheData).filter(entry =>
      new Date(entry.expiresAt) > now
    )

    return {
      totalEntries: Object.keys(this.cacheData).length,
      validEntries: validEntries.length,
      expiredEntries: Object.keys(this.cacheData).length - validEntries.length
    }
  }
}
