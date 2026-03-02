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
   * 缓存时长：7天
   * 说明：城市信息很少变化，7天缓存可以大幅减少 API 调用
   */
  private readonly cacheDuration = 7 * 24 * 60 * 60 * 1000 // 7天
  
  /**
   * 经纬度精度：2位小数（约1.1公里）
   * 说明：城市级别定位不需要高精度，降低精度可以提高缓存命中率
   * - 上海嘉定（31.38, 121.24）和上海浦东（31.23, 121.52）都能命中同一个缓存
   * - 2位小数精度约1.1公里，足以覆盖城市级别的定位需求
   */
  private readonly coordinatePrecision = 2 // 2位小数
  
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
   * 生成缓存 key（使用经纬度，保留指定位数的小数）
   * 说明：降低精度以提高缓存命中率
   * - 2位小数（约1.1公里精度）：适合城市级别定位
   * - 同一城市不同区域的查询都能命中缓存
   * - 例如：上海嘉定（31.38, 121.24）和上海浦东（31.23, 121.52）都能命中缓存
   */
  private generateCacheKey(lat: number, lng: number): string {
    return `${lat.toFixed(this.coordinatePrecision)},${lng.toFixed(this.coordinatePrecision)}`
  }

  /**
   * 检查缓存是否有效
   */
  private isCacheValid(entry: LocationCacheEntry): boolean {
    return new Date(entry.expiresAt) > new Date()
  }

  /**
   * 逆地理编码：根据经纬度获取地址信息（带缓存）
   * @param lat 纬度
   * @param lng 经度
   * @returns 地址信息
   */
  async reverseGeocode(lat: number, lng: number): Promise<LocationResponse> {
    if (!this.apiKey) {
      throw new Error('腾讯地图 API Key 未配置')
    }

    const cacheKey = this.generateCacheKey(lat, lng)
    const cachedEntry = this.cacheData[cacheKey]

    // 检查缓存是否存在且有效
    if (cachedEntry && this.isCacheValid(cachedEntry)) {
      this.logger.log(`✅ 命中缓存: ${cacheKey} -> ${cachedEntry.cityName}`)
      return this.buildResponseFromCache(cachedEntry)
    }

    // 缓存不存在或过期，调用 API
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

      // 保存到缓存
      const cityName = this.extractCityName(data)
      const provinceName = data.result.address_component.province.replace('省', '').replace('市', '')
      const now = new Date()

      this.cacheData[cacheKey] = {
        lat,
        lng,
        cityName,
        provinceName,
        cachedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + this.cacheDuration).toISOString()
      }

      await this.saveCache()

      this.logger.log(`✅ 逆地理编码成功: ${cityName}（已缓存）`)

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
