import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import { Network } from '@/network'
import './index.css'

interface HistoryPriceData {
  date: string
  gas92: number
  gas95: number
  gas98: number
  diesel0: number
  change: number
}

const HistoryPage = () => {
  const [loading, setLoading] = useState(true)
  const [historyData, setHistoryData] = useState<HistoryPriceData[]>([])
  const [selectedRange, setSelectedRange] = useState(7) // 默认7天

  const timeRanges = [
    { label: '近7天', value: 7 },
    { label: '近30天', value: 30 },
    { label: '近90天', value: 90 },
    { label: '全部', value: 180 },
  ]

  // 加载历史价格数据
  const loadHistoryData = async (days: number) => {
    try {
      setLoading(true)
      console.log('开始获取历史价格数据，天数:', days)

      const res = await Network.request({
        url: '/api/oil-price/history',
        method: 'GET',
        data: { days }
      })

      console.log('历史价格数据响应:', res.data)

      if (res.data?.code === 200 && res.data?.data) {
        setHistoryData(res.data.data)
        console.log('历史价格数据解析成功:', res.data.data)
      } else {
        console.error('历史价格数据格式错误:', res.data)
      }
    } catch (error) {
      console.error('获取历史价格数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 切换时间范围
  const handleRangeChange = (range: number) => {
    setSelectedRange(range)
    loadHistoryData(range)
  }

  // 获取涨跌幅颜色
  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-red-500'
    if (change < 0) return 'text-green-500'
    return 'text-gray-500'
  }

  // 获取涨跌幅显示
  const getChangeDisplay = (change: number) => {
    if (change > 0) {
      return `↑ ${Math.abs(change).toFixed(3)}`
    } else if (change < 0) {
      return `↓ ${Math.abs(change).toFixed(3)}`
    }
    return '0.000'
  }

  useLoad(() => {
    console.log('历史价格页面加载')
    loadHistoryData(selectedRange)
  })

  return (
    <View className="w-full min-h-screen bg-gray-50">
      {/* 页面标题 */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <Text className="block text-lg font-bold text-gray-900">历史价格</Text>
      </View>

      {/* 时间筛选器 */}
      <View className="bg-white px-4 py-3">
        <View className="flex flex-row gap-2">
          {timeRanges.map((range, index) => (
            <View
              key={index}
              className={`flex-1 rounded-full px-4 py-2 ${selectedRange === range.value ? 'bg-blue-600' : 'bg-gray-100'}`}
              onClick={() => handleRangeChange(range.value)}
            >
              <Text
                className={`text-sm text-center ${selectedRange === range.value ? 'text-white' : 'text-gray-600'}`}
              >
                {range.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* 走势图区域 */}
      <View className="px-4 py-4">
        <View className="bg-white rounded-2xl p-4 shadow-sm">
          <Text className="block text-base font-semibold mb-3">价格走势</Text>
          <View className="h-48 bg-gray-50 rounded-xl flex items-center justify-center">
            <Text className="text-sm text-gray-500">走势图区域（待实现）</Text>
          </View>
          <Text className="block text-xs text-gray-400 text-center mt-2">
            92号汽油价格走势（元/升）
          </Text>
        </View>
      </View>

      {/* 主要内容区域 */}
      <View className="px-4 py-3">
        {/* 加载状态 */}
        {loading && (
          <View className="flex items-center justify-center py-12">
            <Text className="text-sm text-gray-500">加载中...</Text>
          </View>
        )}

        {/* 历史价格列表 */}
        {!loading && historyData.length > 0 && (
          <View>
            <Text className="block text-base font-semibold mb-3">价格记录</Text>

            {historyData.map((item, index) => (
              <View key={index} className="bg-white rounded-xl p-4 mb-2 shadow-sm">
                <View className="flex flex-row items-center justify-between mb-3">
                  <Text className="block text-sm font-semibold text-gray-900">
                    {item.date}
                  </Text>
                  <Text className={`text-sm font-semibold ${getChangeColor(item.change)}`}>
                    {getChangeDisplay(item.change)}
                  </Text>
                </View>
                <View className="flex flex-row gap-4">
                  <View className="flex-1">
                    <Text className="block text-xs text-gray-500 mb-1">92号</Text>
                    <Text className="block text-sm font-semibold text-gray-900">
                      {item.gas92}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="block text-xs text-gray-500 mb-1">95号</Text>
                    <Text className="block text-sm font-semibold text-gray-900">
                      {item.gas95}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="block text-xs text-gray-500 mb-1">0号柴油</Text>
                    <Text className="block text-sm font-semibold text-gray-900">
                      {item.diesel0}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 空状态 */}
        {!loading && historyData.length === 0 && (
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
    </View>
  )
}

export default HistoryPage
