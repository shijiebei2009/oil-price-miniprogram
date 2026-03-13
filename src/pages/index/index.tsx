import { View, Text } from '@tarojs/components'
import Taro, { useLoad, useDidShow, useShareAppMessage, useShareTimeline, navigateTo } from '@tarojs/taro'
import { useState } from 'react'
import { Network } from '@/network'
import { getCurrentPrice as getCloudCurrentPrice, getProvinceList as getCloudProvinceList, isCloudEnv } from '@/utils/cloud'
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
    time: string
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

  // 获取用户位置并转换为所在城市
  const getCurrentCity = async (): Promise<string> => {
    try {
      console.log('开始获取用户位置...')

      // 根据平台选择坐标系类型
      const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP
      const location = await Taro.getLocation({
        type: isWeapp ? 'gcj02' : 'wgs84' // 小程序用 gcj02，H5 用 wgs84（GPS 坐标）
      })
      console.log('获取到位置:', location)

      // 调用后端逆地理编码接口
      // 注意：H5 环境下，GET 请求的参数必须放在 URL 的 query string 中
      const res = await Network.request({
        url: `/api/location/reverse-geocode?lat=${location.latitude}&lng=${location.longitude}`,
        method: 'GET'
      })

      console.log('逆地理编码完整响应:', res)
      console.log('逆地理编码响应状态码:', res.statusCode)
      console.log('逆地理编码响应数据:', JSON.stringify(res.data))

      if (res.data?.code === 200 && res.data?.data) {
        let cityName = res.data.data.city
        console.log('获取到城市名称:', cityName)

        // 规范化城市名称（确保与后端 PROVINCES 数组一致）
        // 城市名称应该是完整的省份名称（如"北京市"、"上海市"）
        if (!cityName.endsWith('省') && !cityName.endsWith('市') && !cityName.endsWith('自治区')) {
          // 如果没有后缀，尝试添加"市"
          cityName = cityName + '市'
        }

        // 特殊处理：新疆、西藏、内蒙古、广西、宁夏等自治区
        const specialProvinces = {
          '新疆': '新疆维吾尔自治区',
          '西藏': '西藏自治区',
          '内蒙古': '内蒙古自治区',
          '广西': '广西壮族自治区',
          '宁夏': '宁夏回族自治区'
        }

        for (const [shortName, fullName] of Object.entries(specialProvinces)) {
          if (cityName.includes(shortName) && !cityName.includes('自治区')) {
            cityName = fullName
            break
          }
        }

        console.log('规范化后的城市名称:', cityName)
        Taro.showToast({
          title: `已定位到${cityName}`,
          icon: 'success',
          duration: 1500
        })
        return cityName
      } else {
        console.error('逆地理编码失败:', res.data)
        return '上海市'
      }
    } catch (error) {
      console.error('获取位置失败:', error)
      // 位置获取失败时，提示用户
      Taro.showToast({
        title: '位置获取失败，使用默认城市',
        icon: 'none',
        duration: 2000
      })
      return '上海市'
    }
  }

  // 加载油价数据
  const loadPriceData = async (province?: string) => {
    try {
      setLoading(true)
      console.log('开始获取油价数据，省份:', province)

      let res: any

      // 根据环境选择调用方式
      if (isCloudEnv()) {
        console.log('使用云函数调用')
        res = await getCloudCurrentPrice(province)
      } else {
        console.log('使用 API 调用')
        const networkRes = await Network.request({
          url: province ? `/api/oil-price/province/current?province=${encodeURIComponent(province)}` : '/api/oil-price/province/current',
          method: 'GET'
        })
        // 从 Network.request 的返回中提取实际的响应数据
        res = networkRes.data
      }

      console.log('油价数据响应:', res)

      if (res?.code === 200 && res?.data) {
        setPriceData(res.data)
        console.log('油价数据解析成功:', res.data)
      } else {
        console.error('油价数据格式错误:', res)
        Taro.showToast({
          title: '数据加载失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('获取油价数据失败:', error)
      Taro.showToast({
        title: '网络请求失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  // 加载城市列表
  const loadCityList = async () => {
    try {
      let res: any

      // 根据环境选择调用方式
      if (isCloudEnv()) {
        console.log('使用云函数调用')
        res = await getCloudProvinceList()
      } else {
        console.log('使用 API 调用')
        const networkRes = await Network.request({
          url: '/api/oil-price/provinces',
          method: 'GET'
        })
        // 从 Network.request 的返回中提取实际的响应数据
        res = networkRes.data
      }

      if (res?.code === 200 && res?.data) {
        setCityList(res.data)
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
    console.log('handleCitySelect 被调用，城市名称:', cityName)
    setCurrentCity(cityName)
    loadPriceData(cityName)
  }

  useLoad(async () => {
    console.log('页面加载')

    // 先加载省份列表
    loadCityList()

    // 尝试获取用户位置
    const city = await getCurrentCity()
    if (city) {
      setCurrentCity(city)
      console.log('自动定位到城市:', city)

      // 保存城市信息到本地存储，供其他页面使用
      Taro.setStorageSync('userCity', city)
    }
  })

  useDidShow(() => {
    console.log('页面显示')
    loadPriceData(currentCity)
  })

  // 配置分享给好友
  useShareAppMessage(() => {
    return {
      title: `${currentCity}最新油价查询`,
      path: '/pages/index/index',
      imageUrl: ''
    }
  })

  // 配置分享到朋友圈
  useShareTimeline(() => {
    return {
      title: '油价查询小程序 - 实时油价查询',
      query: '',
      imageUrl: ''
    }
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
      url: `/pages/history/index?province=${currentCity}`
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

  // 导航到全国排名页面
  const navigateToRank = () => {
    navigateTo({
      url: '/pages/rank/index'
    })
  }

  // 处理分享按钮点击
  const handleShare = async () => {
    const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP

    // 小程序端：显示提示
    if (isWeapp) {
      await Taro.showModal({
        title: '分享提示',
        content: '请点击右上角 "..." 按钮，选择"转发给朋友"或"分享到朋友圈"',
        showCancel: false,
        confirmText: '知道了'
      })
      return
    }

    // H5端：复制分享文本
    const shareText = `油价查询小程序\n\n${currentCity}最新油价：\n92#: ${priceData?.currentPrices[0]?.price.toFixed(2)}元/升\n95#: ${priceData?.currentPrices[1]?.price.toFixed(2)}元/升\n98#: ${priceData?.currentPrices[2]?.price.toFixed(2)}元/升\n柴油: ${priceData?.currentPrices[3]?.price.toFixed(2)}元/升\n\n下次调价：${priceData?.nextAdjustment?.date} ${priceData?.nextAdjustment?.time || ''}\n${priceData?.nextAdjustment?.direction === 'up' ? '预计上涨' : priceData?.nextAdjustment?.direction === 'down' ? '预计下降' : '预计稳定'}\n\n快来查查您所在地的油价吧！`

    await Taro.setClipboardData({
      data: shareText
    })

    await Taro.showToast({
      title: '已复制分享文案',
      icon: 'success',
      duration: 2000
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
              paddingLeft: '12px',
              paddingRight: '8px',
              paddingTop: '8px',
              paddingBottom: '8px',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '6px'
            }}
            onClick={handleCityPickerOpen}
          >
            <Text style={{ fontSize: '14px', lineHeight: 1 }}>📍</Text>
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
                      {priceData.nextAdjustment.daysRemaining === 0
                        ? '今天 24 时'
                        : `距离调价还有 ${priceData.nextAdjustment.daysRemaining} 天`
                      }
                    </Text>
                  </View>
                </View>

                <View className="flex flex-row items-center justify-between bg-gray-50 rounded-xl p-4 mb-3">
                  <View>
                    <Text className="block text-xs text-gray-500 mb-1">预计日期</Text>
                    <Text className="block text-base font-semibold text-gray-900">
                      {priceData.nextAdjustment.date} {priceData.nextAdjustment.time}
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
                  onClick={navigateToRank}
                >
                  <Text className="text-2xl mb-2">🏆</Text>
                  <Text className="text-sm font-semibold text-gray-900">全国排名</Text>
                  <Text className="text-xs text-gray-500 mt-1">油价对比</Text>
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

      {/* 分享按钮区域 - 页面底部 */}
      <View className="mx-3 mb-3">
        <View
          className="rounded-2xl p-4 shadow-sm"
          style={{
            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            animation: 'bounce 2s infinite'
          }}
          onClick={handleShare}
        >
          <View style={{ flex: 1 }}>
            <Text className="block text-base font-bold text-white mb-1">
              分享给好友
            </Text>
            <Text className="block text-xs text-white opacity-90">
              让更多人了解实时油价
            </Text>
          </View>
          <View
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Text style={{ fontSize: '24px' }}>🎁</Text>
          </View>
        </View>
      </View>

      {/* 城市选择器 */}
      <CityPicker
        visible={showCityPicker}
        cityList={cityList}
        currentCity={currentCity}
        onSelect={handleCitySelect}
        onClose={() => setShowCityPicker(false)}
      />
    </View>
  )
}

export default IndexPage
