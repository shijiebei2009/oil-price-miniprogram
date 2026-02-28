import { View, Text } from '@tarojs/components'
import Taro, { useLoad, useDidShow, navigateTo } from '@tarojs/taro'
import { useState } from 'react'
import { Network } from '@/network'
import CityPicker from '@/components/CityPicker'
import './index.css'

// 油价数据类型
interface OilPrice {
  name: string
  price: number
  previousPrice: number
  change: number
}

interface PriceData {
  currentPrices: OilPrice[]
  nextAdjustment: {
    date: string
    direction: 'up' | 'down' | 'stable'
    expectedChange: number
    daysRemaining: number
    trend?: string
  }
  updateTime: string
  cityName?: string
  provinceName?: string
}

interface CityItem {
  name: string
  region: string
  level: number
  gas92: number
  gas95: number
  gas98: number
  diesel0: number
}

const IndexPage = () => {
  const [loading, setLoading] = useState(true)
  const [priceData, setPriceData] = useState<PriceData | null>(null)
  const [currentCity, setCurrentCity] = useState('上海市')
  const [showCityPicker, setShowCityPicker] = useState(false)
  const [cityList, setCityList] = useState<CityItem[]>([])

  // 获取用户位置并转换为所在省份
  const getCurrentProvince = async (): Promise<string> => {
    try {
      console.log('开始获取用户位置...')
      const location = await Taro.getLocation({
        type: 'wgs84'
      })
      console.log('获取到位置:', location)

      // 注意：这里需要使用腾讯地图的逆地理编码API来获取城市名称
      // 由于没有配置API密钥，这里使用简化的方式
      // 实际项目中需要配置腾讯地图API密钥并调用逆地理编码接口
      console.log('需要配置腾讯地图API密钥来获取城市名称')

      // 如果没有配置API密钥，返回默认省份
      return '上海市'
    } catch (error) {
      console.error('获取位置失败:', error)
      return '上海市'
    }
  }

  // 加载油价数据
  const loadPriceData = async (province?: string) => {
    try {
      setLoading(true)
      console.log('开始获取油价数据，省份:', province)

      const res = await Network.request({
        url: '/api/oil-price/province/current',
        method: 'GET',
        data: province ? { province } : {}
      })

      console.log('油价数据响应:', res.data)

      if (res.data?.code === 200 && res.data?.data) {
        setPriceData(res.data.data)
        console.log('油价数据解析成功:', res.data.data)
      } else {
        console.error('油价数据格式错误:', res.data)
      }
    } catch (error) {
      console.error('获取油价数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 加载城市列表
  const loadCityList = async () => {
    try {
      const res = await Network.request({
        url: '/api/oil-price/provinces',
        method: 'GET'
      })

      if (res.data?.code === 200 && res.data?.data) {
        setCityList(res.data.data)
      }
    } catch (error) {
      console.error('获取城市列表失败:', error)
    }
  }

  // 打开城市选择器
  const handleCityPickerOpen = () => {
    setShowCityPicker(true)
    if (cityList.length === 0) {
      loadCityList()
    }
  }

  // 选择城市
  const handleCitySelect = (cityName: string) => {
    setCurrentCity(cityName)
    loadPriceData(cityName)
  }

  useLoad(async () => {
    console.log('页面加载')

    // 先加载省份列表
    loadCityList()

    // 尝试获取用户位置
    const province = await getCurrentProvince()
    if (province) {
      setCurrentCity(province)
      console.log('自动定位到省份:', province)
    }
  })

  useDidShow(() => {
    console.log('页面显示')
    loadPriceData(currentCity)
  })

  // 获取调价方向的显示
  const getAdjustmentDirection = (direction: string) => {
    switch (direction) {
      case 'up':
        return { text: '预计上涨', color: 'text-red-500', bg: 'bg-red-50' }
      case 'down':
        return { text: '预计下降', color: 'text-green-500', bg: 'bg-green-50' }
      case 'stable':
        return { text: '预计稳定', color: 'text-gray-500', bg: 'bg-gray-50' }
      default:
        return { text: '未知', color: 'text-gray-500', bg: 'bg-gray-50' }
    }
  }

  // 获取涨跌幅显示
  const getChangeDisplay = (change: number) => {
    if (change > 0) {
      return `↑ ${change.toFixed(2)}`
    } else if (change < 0) {
      return `↓ ${Math.abs(change).toFixed(2)}`
    }
    return '0.00'
  }

  // 获取涨跌幅颜色
  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-red-500'
    if (change < 0) return 'text-green-500'
    return 'text-gray-500'
  }

  // 导航到历史价格页面
  const navigateToHistory = () => {
    navigateTo({
      url: '/pages/history/index'
    })
  }

  // 导航到城市对比页面
  const navigateToCityCompare = () => {
    navigateTo({
      url: '/pages/city/index'
    })
  }

  // 导航到通知设置页面
  const navigateToNotice = () => {
    navigateTo({
      url: '/pages/notice/index'
    })
  }

  // 导航到加油建议页面
  const navigateToTips = () => {
    navigateTo({
      url: '/pages/tips/index'
    })
  }

  return (
    <View className="w-full min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* 顶部标题栏 - 渐变背景 */}
      <View className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3">
        <View className="flex flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="block text-lg font-bold text-white">油价查询</Text>
            <Text className="block text-xs text-blue-100 mt-1">
              {loading ? '加载中...' : `更新：${priceData?.updateTime || '暂无数据'}`}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              borderRadius: '20px',
              paddingLeft: '16px',
              paddingRight: '8px',
              paddingTop: '8px',
              paddingBottom: '8px',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '8px'
            }}
            onClick={handleCityPickerOpen}
          >
            <Text className="block text-sm font-semibold text-white">{currentCity}</Text>
            <View
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Text
                style={{
                  fontSize: '10px',
                  color: 'white',
                  lineHeight: 1,
                  marginTop: '2px'
                }}
              >
                ▼
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 主要内容区域 */}
      <View className="p-3">
        {/* 加载状态 */}
        {loading && (
          <View className="flex items-center justify-center py-12">
            <Text className="text-sm text-gray-500">加载中...</Text>
          </View>
        )}

        {/* 数据展示 */}
        {!loading && priceData && (
          <View className="flex flex-col gap-3">
            {/* 当前油价卡片 */}
            <View className="bg-white rounded-2xl p-4 shadow-sm">
              <View className="flex flex-row items-center justify-between mb-4">
                <Text className="block text-lg font-semibold text-gray-900">当前油价</Text>
                {priceData.provinceName && priceData.cityName && (
                  <Text className="block text-xs text-gray-500">
                    {priceData.provinceName} · {priceData.cityName}
                  </Text>
                )}
              </View>

              {priceData.currentPrices.map((item, index) => (
                <View
                  key={index}
                  className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-3 mb-2 flex flex-row items-center justify-between"
                >
                  <View className="flex-1">
                    <Text className="block text-sm font-semibold text-gray-900 mb-1">
                      {item.name}
                    </Text>
                    <Text className="block text-xs text-gray-500">元/升</Text>
                  </View>
                  <View className="text-right">
                    <Text className="block text-3xl font-bold text-gray-900">
                      {item.price.toFixed(2)}
                    </Text>
                    <Text className={`block text-sm ${getChangeColor(item.change)}`}>
                      {getChangeDisplay(item.change)}
                    </Text>
                    {item.previousPrice !== undefined && (
                      <Text className="block text-xs text-gray-400 mt-1">
                        上次：{item.previousPrice.toFixed(2)}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>

            {/* 调价预警卡片 */}
            {priceData.nextAdjustment && (
              <View className="bg-white rounded-2xl p-4 shadow-sm">
                <View className="flex flex-row items-center justify-between mb-4">
                  <Text className="block text-lg font-semibold text-gray-900">下次调价</Text>
                  <View className="flex items-center gap-2">
                    <View className="w-2 h-2 rounded-full bg-red-500"></View>
                    <Text className="text-xs text-gray-500">
                      距离调价还有 {priceData.nextAdjustment.daysRemaining} 天
                    </Text>
                  </View>
                </View>

                <View className="flex flex-row items-center justify-between bg-gray-50 rounded-xl p-4 mb-3">
                  <View>
                    <Text className="block text-xs text-gray-500 mb-1">预计日期</Text>
                    <Text className="block text-base font-semibold text-gray-900">
                      {priceData.nextAdjustment.date}
                    </Text>
                  </View>
                  <View
                    className={`px-4 py-2 rounded-full ${getAdjustmentDirection(priceData.nextAdjustment.direction).bg}`}
                  >
                    <Text
                      className={`text-sm font-semibold ${getAdjustmentDirection(priceData.nextAdjustment.direction).color}`}
                    >
                      {getAdjustmentDirection(priceData.nextAdjustment.direction).text}
                    </Text>
                  </View>
                </View>

                {/* 趋势说明 */}
                {priceData.nextAdjustment.trend && (
                  <View className="bg-blue-50 rounded-lg px-3 py-2">
                    <Text className="block text-xs text-blue-600">
                      📊 {priceData.nextAdjustment.trend}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* 快捷功能入口 */}
            <View className="bg-white rounded-2xl p-4 shadow-sm">
              <View className="grid grid-cols-2 gap-3">
                <View
                  className="bg-blue-50 rounded-xl p-4 flex flex-col items-center"
                  onClick={navigateToHistory}
                >
                  <Text className="text-2xl mb-2">📈</Text>
                  <Text className="text-sm font-semibold text-gray-900">历史价格</Text>
                  <Text className="text-xs text-gray-500 mt-1">查看走势</Text>
                </View>
                <View
                  className="bg-green-50 rounded-xl p-4 flex flex-col items-center"
                  onClick={navigateToNotice}
                >
                  <Text className="text-2xl mb-2">🔔</Text>
                  <Text className="text-sm font-semibold text-gray-900">调价提醒</Text>
                  <Text className="text-xs text-gray-500 mt-1">开启通知</Text>
                </View>
                <View
                  className="bg-purple-50 rounded-xl p-4 flex flex-col items-center"
                  onClick={navigateToCityCompare}
                >
                  <Text className="text-2xl mb-2">🌍</Text>
                  <Text className="text-sm font-semibold text-gray-900">多城市对比</Text>
                  <Text className="text-xs text-gray-500 mt-1">查看差异</Text>
                </View>
                <View
                  className="bg-orange-50 rounded-xl p-4 flex flex-col items-center"
                  onClick={navigateToTips}
                >
                  <Text className="text-2xl mb-2">💰</Text>
                  <Text className="text-sm font-semibold text-gray-900">省钱攻略</Text>
                  <Text className="text-xs text-gray-500 mt-1">加油建议</Text>
                </View>
              </View>
            </View>

            {/* 提示信息 */}
            <View className="bg-blue-50 rounded-xl p-4">
              <Text className="block text-xs text-blue-600 text-center">
                提示：油价每10个工作日调整一次，具体以发改委公布为准
              </Text>
            </View>
          </View>
        )}

        {/* 空状态 */}
        {!loading && !priceData && (
          <View className="flex flex-col items-center justify-center py-12">
            <Text className="block text-3xl mb-3">📭</Text>
            <Text className="block text-base text-gray-500 text-center">
              暂无数据
            </Text>
            <Text className="block text-sm text-gray-400 text-center mt-2">
              请稍后再试
            </Text>
          </View>
        )}
      </View>

      {/* 城市选择器 */}
      <CityPicker
        visible={showCityPicker}
        currentCity={currentCity}
        cities={cityList}
        onSelect={handleCitySelect}
        onClose={() => setShowCityPicker(false)}
      />
    </View>
  )
}

export default IndexPage
