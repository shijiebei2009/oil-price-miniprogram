import { Injectable, Logger } from '@nestjs/common'
import axios from 'axios'

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

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name)
  private readonly apiKey = process.env.TENCENT_MAP_API_KEY
  private readonly baseUrl = 'https://apis.map.qq.com/ws/geocoder/v1'

  constructor() {
    if (!this.apiKey) {
      this.logger.warn('⚠️ 腾讯地图 API Key 未配置，位置服务将不可用')
    }
  }

  /**
   * 逆地理编码：根据经纬度获取地址信息
   * @param lat 纬度
   * @param lng 经度
   * @returns 地址信息
   */
  async reverseGeocode(lat: number, lng: number): Promise<LocationResponse> {
    if (!this.apiKey) {
      throw new Error('腾讯地图 API Key 未配置')
    }

    try {
      const url = `${this.baseUrl}/?location=${lat},${lng}&key=${this.apiKey}&get_poi=1`
      this.logger.log(`调用腾讯地图逆地理编码 API: lat=${lat}, lng=${lng}`)

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

      this.logger.log(`✅ 逆地理编码成功: ${data.result.address_component.city}`)

      return data
    } catch (error) {
      this.logger.error('逆地理编码失败:', error.message)
      throw new Error(`获取位置信息失败: ${error.message}`)
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
}
