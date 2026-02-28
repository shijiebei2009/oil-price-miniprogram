import { View, Text, ScrollView } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import { Network } from '@/network'
import SimpleLineChart from '@/components/SimpleLineChart'
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
  const [selectedRange, setSelectedRange] = useState(7)

  const timeRanges = [
    { label: '近5次', value: 5 },
    { label: '近10次', value: 10 },
    { label: '近15次', value: 15 },
    { label: '全部', value: 20 },
  ]

  const loadHistoryData = async (count: number) => {
    try {
      setLoading(true)
      const res = await Network.request({
        url: '/api/oil-price/history',
        method: 'GET',
        data: { count }
      })

      if (res.data?.code === 200 && res.data?.data) {
        const sortedData = [...res.data.data].sort((a, b) => {
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        })
        setHistoryData(sortedData)
      }
    } catch (error) {
      console.error('获取历史价格数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRangeChange = (range: number) => {
    setSelectedRange(range)
    loadHistoryData(range)
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-red-500'
    if (change < 0) return 'text-green-500'
    return 'text-gray-500'
  }

  const getChangeDisplay = (change: number) => {
    if (change > 0) {
      return `↑ ${Math.abs(change).toFixed(3)}`
    } else if (change < 0) {
      return `↓ ${Math.abs(change).toFixed(3)}`
    }
    return '0.000'
  }

  useLoad(() => {
    loadHistoryData(selectedRange)
  })

  return (
    <ScrollView scrollY className="w-full h-screen bg-white">
      {/* 页面标题和筛选器 */}
      <View className="bg-white px-4 py-3 border-b border-gray-100 sticky top-0 z-10 bg-opacity-95">
        <View className="flex flex-row justify-between items-center mb-3">
          <Text className="text-base font-bold text-gray-900">历史价格</Text>
          <View className="flex flex-row gap-2">
            {timeRanges.map((range, index) => (
              <View
                key={index}
                className={`rounded-lg px-3 py-1.5 ${selectedRange === range.value ? 'bg-blue-600' : 'bg-gray-100'}`}
                onClick={() => handleRangeChange(range.value)}
              >
                <Text
                  className={`text-sm font-medium ${selectedRange === range.value ? 'text-white' : 'text-gray-600'}`}
                >
                  {range.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* 走势图区域 - 固定高度 400px */}
      <View className="w-full px-2 py-3">
        {historyData.length > 0 && (
          <View className="bg-gray-50 rounded-xl p-2">
            <SimpleLineChart
              data={historyData.map((item) => ({
                date: item.date,
                gas92: item.gas92,
                gas95: item.gas95,
                gas98: item.gas98,
                diesel0: item.diesel0
              }))}
              height={400}
            />
          </View>
        )}
      </View>

      {/* 主要内容区域 */}
      <View className="px-4 py-3 pb-8">
        {loading && (
          <View className="flex items-center justify-center py-12">
            <Text className="text-sm text-gray-500">加载中...</Text>
          </View>
        )}

        {!loading && historyData.length > 0 && (
          <View>
            <Text className="block text-base font-semibold mb-3 text-gray-900">价格记录</Text>

            {[...historyData].reverse().map((item, index) => (
              <View key={index} className="bg-white border border-gray-100 rounded-xl p-4 mb-3">
                <View className="flex flex-row items-center justify-between mb-3">
                  <Text className="block text-sm font-semibold text-gray-900">
                    {item.date}
                  </Text>
                  <Text className={`block text-sm font-semibold ${getChangeColor(item.change)}`}>
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
    </ScrollView>
  )
}

export default HistoryPage
