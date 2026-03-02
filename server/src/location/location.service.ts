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
  private readonly apiKey = process.env.TENCENT_MAP_API_KEY
  private readonly baseUrl = 'https://apis.map.qq.com/ws/geocoder/v1'
  private readonly cacheFilePath = path.join(process.cwd(), 'data', 'location-cache.json')
  
  /**
   * 基础缓存时长：7天
   */
  private readonly baseCacheDuration = 7 * 24 * 60 * 60 * 1000
  
  /**
   * 随机偏移范围：±12小时
   * 说明：避免所有缓存同时过期，防止缓存雪崩
   */
  private readonly randomOffsetRange = 24 * 60 * 60 * 1000 // 24小时（±12小时）
  
  /**
   * 距离阈值：10公里
   * 说明：如果用户位置与缓存位置距离在10公里内，直接使用缓存
   */
  private readonly distanceThreshold = 10 // 10公里
  
  private cacheData: LocationCache = {}

  constructor() {
    if (!this.apiKey) {
      this.logger.warn('⚠️ 腾讯地图 API Key 未配置，位置服务将不可用')
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
   * 计算随机过期时间（避免缓存雪崩）
   * @returns 过期时间戳
   */
  private calculateExpirationTime(): number {
    const now = Date.now()
    // 基础过期时间：7天
    const baseExpiresAt = now + this.baseCacheDuration
    // 随机偏移：±12小时（避免所有缓存同时过期）
    const randomOffset = Math.random() * this.randomOffsetRange - (this.randomOffsetRange / 2)
    
    return baseExpiresAt + randomOffset
  }

  /**
   * 生成缓存 key（使用城市名称）
   * 说明：城市级聚合缓存，同一城市的所有查询都使用同一个缓存
   * 命中率接近100%，只排除城市边界边缘的查询
   */
  private generateCacheKey(provinceName: string, cityName: string): string {
    return `${provinceName}_${cityName}`
  }

  /**
   * 查找附近的缓存（距离算法）
   * 说明：查找距离用户位置10公里内的缓存
   * @param lat 用户纬度
   * @param lng 用户经度
   * @returns 最近的缓存（如果距离在阈值内）
   */
  private findNearbyCache(lat: number, lng: number): LocationCacheEntry | null {
    let nearestCache: LocationCacheEntry | null = null
    let minDistance = Infinity

    for (const cacheEntry of Object.values(this.cacheData)) {
      // 检查缓存是否过期
      if (new Date(cacheEntry.expiresAt) <= new Date()) {
        continue
      }

      // 计算距离
      const distance = this.calculateDistance(lat, lng, cacheEntry.lat, cacheEntry.lng)
      
      // 如果距离在阈值内，记录最近的缓存
      if (distance < this.distanceThreshold && distance < minDistance) {
        minDistance = distance
        nearestCache = cacheEntry
      }
    }

    if (nearestCache) {
      this.logger.log(`✅ 命中附近缓存: 距离 ${minDistance.toFixed(2)} 公里`)
    }

    return nearestCache
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
   * 逆地理编码：根据经纬度获取地址信息（带距离算法缓存）
   * @param lat 纬度
   * @param lng 经度
   * @returns 地址信息
   */
  async reverseGeocode(lat: number, lng: number): Promise<LocationResponse> {
    if (!this.apiKey) {
      throw new Error('腾讯地图 API Key 未配置')
    }

    // 1. 先查找附近的缓存（距离算法）
    const nearbyCache = this.findNearbyCache(lat, lng)
    if (nearbyCache) {
      return this.buildResponseFromCache(nearbyCache)
    }

    // 2. 缓存未命中，调用 API
    try {
      const url = `${this.baseUrl}/?location=${lat},${lng}&key=${this.apiKey}&get_poi=1`
      this.logger.log(`🔍 调用腾讯地图逆地理编码 API: lat=${lat}, lng=${lng}`)

      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      const data = response.data

      if (data.status !== 0) {
        this.logger.error(`腾讯地图 API 返回错误: ${data.message}`)
        throw new Error(`腾讯地图 API 错误: ${data.message}`)
      }

      // 3. 保存到缓存（使用城市名称作为缓存Key）
      const cityName = this.extractCityName(data)
      const provinceName = data.result.address_component.province.replace('省', '').replace('市', '')
      const cacheKey = this.generateCacheKey(provinceName, cityName)

      this.cacheData[cacheKey] = {
        lat,
        lng,
        cityName,
        provinceName,
        cachedAt: new Date().toISOString(),
        expiresAt: new Date(this.calculateExpirationTime()).toISOString()
      }

      await this.saveCache()

      this.logger.log(`✅ 逆地理编码成功: ${cityName}（已缓存，7天±12小时过期）`)

      return data
    } catch (error) {
      this.logger.error('逆地理编码失败:', error.message)
      throw new Error(`获取位置信息失败: ${error.message}`)
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
   * @param locationResponse 腾讯地图返回的地址信息
   * @returns 城市名称
   */
  extractCityName(locationResponse: LocationResponse): string {
    const addressComponent = locationResponse.result.address_component
    let cityName = addressComponent.city

    // 处理直辖市（city 字段可能为空）
    if (!cityName || cityName === '') {
      // 如果 city 为空，使用 province（直辖市的情况）
      cityName = addressComponent.province.replace('市', '')
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
