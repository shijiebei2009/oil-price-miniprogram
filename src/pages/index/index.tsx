import { View, Text } from '@tarojs/components'
import { useLoad, useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { Network } from '@/network'
import './index.css'

// 油价数据类型
interface OilPrice {
  name: string
  price: number
  change: number
}

interface PriceData {
  currentPrices: OilPrice[]
  nextAdjustment: {
    date: string
    direction: 'up' | 'down' | 'stable'
    expectedChange: number
    daysRemaining: number
  }
  updateTime: string
}

const IndexPage = () => {
  const [loading, setLoading] = useState(true)
  const [priceData, setPriceData] = useState<PriceData | null>(null)

  // 加载油价数据
  const loadPriceData = async () => {
    try {
      setLoading(true)
      console.log('开始获取油价数据...')

      const res = await Network.request({
        url: '/api/oil-price/current',
        method: 'GET'
      })

      console.log('油价数据响应:', res.data)

      // 解析响应数据
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

  useLoad(() => {
    console.log('页面加载')
  })

  useDidShow(() => {
    console.log('页面显示')
    loadPriceData()
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

  return (
    <View className="w-full min-h-screen bg-gray-50">
      {/* 顶部标题栏 */}
      <View className="bg-white px-4 py-4 shadow-sm">
        <Text className="block text-2xl font-bold text-gray-900">油价查询</Text>
        <Text className="block text-sm text-gray-500 mt-1">
          {loading ? '加载中...' : `更新时间：${priceData?.updateTime || '暂无数据'}`}
        </Text>
      </View>

      {/* 主要内容区域 */}
      <View className="p-4">
        {/* 加载状态 */}
        {loading && (
          <View className="flex items-center justify-center py-12">
            <Text className="text-sm text-gray-500">加载中...</Text>
          </View>
        )}

        {/* 数据展示 */}
        {!loading && priceData && (
          <View className="flex flex-col gap-4">
            {/* 当前油价卡片 */}
            <View className="bg-white rounded-xl p-4 shadow-sm">
              <Text className="block text-lg font-semibold mb-4">当前油价</Text>

              {priceData.currentPrices.map((item, index) => (
                <View
                  key={index}
                  className="bg-gray-50 rounded-lg p-4 mb-3 flex flex-row items-center justify-between"
                >
                  <View className="flex-1">
                    <Text className="block text-base font-semibold text-gray-900 mb-1">
                      {item.name}
                    </Text>
                    <Text className="block text-sm text-gray-500">元/升</Text>
                  </View>
                  <View className="text-right">
                    <Text className="block text-2xl font-bold text-gray-900">
                      {item.price.toFixed(2)}
                    </Text>
                    <Text className={`block text-sm ${getChangeColor(item.change)}`}>
                      {getChangeDisplay(item.change)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* 调价预警卡片 */}
            {priceData.nextAdjustment && (
              <View className="bg-white rounded-xl p-4 shadow-sm">
                <Text className="block text-lg font-semibold mb-4">下次调价</Text>

                <View className="flex flex-row items-center justify-between mb-4">
                  <View>
                    <Text className="block text-sm text-gray-500 mb-1">预计日期</Text>
                    <Text className="block text-base font-semibold text-gray-900">
                      {priceData.nextAdjustment.date}
                    </Text>
                  </View>
                  <View className={`px-4 py-2 rounded-full ${getAdjustmentDirection(priceData.nextAdjustment.direction).bg}`}>
                    <Text
                      className={`text-sm font-semibold ${getAdjustmentDirection(priceData.nextAdjustment.direction).color}`}
                    >
                      {getAdjustmentDirection(priceData.nextAdjustment.direction).text}
                    </Text>
                  </View>
                </View>

                <View className="flex flex-row items-center justify-between">
                  <View>
                    <Text className="block text-sm text-gray-500 mb-1">预测幅度</Text>
                    <Text
                      className={`block text-lg font-bold ${getChangeColor(priceData.nextAdjustment.expectedChange)}`}
                    >
                      {getChangeDisplay(priceData.nextAdjustment.expectedChange)}
                    </Text>
                  </View>
                  <View className="text-right">
                    <Text className="block text-sm text-gray-500 mb-1">倒计时</Text>
                    <Text className="block text-base font-semibold text-gray-900">
                      {priceData.nextAdjustment.daysRemaining} 天
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* 提示信息 */}
            <View className="bg-blue-50 rounded-lg p-4">
              <Text className="block text-sm text-blue-600 text-center">
                提示：油价每10个工作日调整一次，具体以发改委公布为准
              </Text>
            </View>
          </View>
        )}

        {/* 空状态 */}
        {!loading && !priceData && (
          <View className="flex flex-col items-center justify-center py-12">
            <Text className="block text-base text-gray-500 text-center">
              暂无数据
            </Text>
            <Text className="block text-sm text-gray-400 text-center mt-2">
              请稍后再试
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}

export default IndexPage
