import { Controller, Get, Query, Logger } from '@nestjs/common'
import { LocationService, LocationResponse } from './location.service'

@Controller('location')
export class LocationController {
  private readonly logger = new Logger(LocationController.name)

  constructor(private readonly locationService: LocationService) {}

  /**
   * 逆地理编码：根据经纬度获取城市名称
   * @param lat 纬度
   * @param lng 经度
   * @returns 城市名称
   */
  @Get('reverse-geocode')
  async reverseGeocode(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
  ) {
    console.log('收到逆地理编码请求，坐标:', lat, lng)

    if (!lat || !lng) {
      return {
        code: 400,
        msg: '缺少必需参数：lat 和 lng',
        data: null,
      }
    }

    try {
      const locationResponse = await this.locationService.reverseGeocode(
        parseFloat(lat),
        parseFloat(lng),
      )

      const cityName = this.locationService.extractCityName(locationResponse)

      console.log('返回城市名称:', cityName)

      return {
        code: 200,
        msg: 'success',
        data: {
          city: cityName,
          address: locationResponse.result.address,
          province: locationResponse.result.address_component.province,
          fullAddress: locationResponse.result.formatted_addresses.recommend,
        },
      }
    } catch (error) {
      console.error('逆地理编码失败:', error.message)

      return {
        code: 500,
        msg: error.message,
        data: null,
      }
    }
  }

  /**
   * 获取缓存统计信息（用于调试）
   */
  @Get('cache-stats')
  async getCacheStats() {
    try {
      const stats = this.locationService.getCacheStats()
      return {
        code: 200,
        msg: 'success',
        data: stats
      }
    } catch (error) {
      this.logger.error('获取缓存统计失败:', error.message)
      return {
        code: 500,
        msg: error.message,
        data: null
      }
    }
  }

  /**
   * 清空缓存（用于调试）
   */
  @Get('clear-cache')
  async clearCache() {
    try {
      await this.locationService.clearCache()
      return {
        code: 200,
        msg: '缓存已清空',
        data: null
      }
    } catch (error) {
      this.logger.error('清空缓存失败:', error.message)
      return {
        code: 500,
        msg: error.message,
        data: null
      }
    }
  }
}
