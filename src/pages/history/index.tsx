import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
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

const HISTORY_CACHE_KEY = 'oil_price_history_data'

const HistoryPage = () => {
  const [loading, setLoading] = useState(true)
  const [historyData, setHistoryData] = useState<HistoryPriceData[]>([])
  const [currentProvince, setCurrentProvince] = useState('上海市')

  // 从本地缓存加载历史数据
  const loadHistoryFromCache = async (): Promise<HistoryPriceData[] | null> => {
    try {
      const res = await Taro.getStorage({ key: HISTORY_CACHE_KEY })
      if (res.data) {
        console.log('从缓存加载历史价格数据:', res.data)
        return JSON.parse(res.data) as HistoryPriceData[]
      }
    } catch (error) {
      console.log('未找到缓存数据:', error)
    }
    return null
  }

  // 保存历史数据到本地缓存
  const saveHistoryToCache = async (data: HistoryPriceData[]) => {
    try {
      await Taro.setStorage({
        key: HISTORY_CACHE_KEY,
        data: JSON.stringify(data)
      })
      console.log('历史价格数据已保存到缓存')
    } catch (error) {
      console.error('保存历史价格数据到缓存失败:', error)
    }
  }

  const loadHistoryData = async (province: string = currentProvince) => {
    try {
      setLoading(true)

      // 先从缓存加载
      const cachedData = await loadHistoryFromCache()
      if (cachedData && cachedData.length > 0) {
        const sortedData = [...cachedData].sort((a, b) => {
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        })
        setHistoryData(sortedData)
      }

      // 然后请求最新数据，传递省份参数
      const res = await Network.request({
        url: `/api/oil-price/history?province=${province}`,
        method: 'GET'
      })

      // res.data 包含实际的响应数据 { code, msg, data }
      if (res.data?.code === 200 && res.data?.data) {
        const sortedData = [...res.data.data].sort((a, b) => {
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        })
        setHistoryData(sortedData)

        // 保存到缓存
        await saveHistoryToCache(res.data.data)
      } else {
        console.error('历史价格数据格式错误:', res.data)
        Taro.showToast({
          title: '数据加载失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('获取历史价格数据失败:', error)
      Taro.showToast({
        title: '网络请求失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
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

  useLoad((options) => {
    // 从页面参数获取省份，需要解码 URL 参数
    const province = options?.province ? decodeURIComponent(options.province) : '上海市'
    setCurrentProvince(province)
    loadHistoryData(province)
  })

  return (
    <ScrollView scrollY className="w-full h-screen bg-white">
      {/* 页面标题 */}
      <View className="bg-white px-4 py-3 border-b border-gray-100 sticky top-0 z-10 bg-opacity-95">
        <Text className="text-base font-bold text-gray-900">历史价格</Text>
        <Text className="block text-xs text-gray-500 mt-1">{currentProvince}</Text>
      </View>

      {/* 走势图区域 - 固定高度 400px */}
      <View className="w-full px-2 py-3">
        {historyData.length > 0 && (
          <View className="bg-gray-50 rounded-xl p-2">
            {/* 油品图例 */}
            <View className="flex flex-row justify-center gap-4 mb-3 flex-wrap">
              <View className="flex items-center">
                <View className="w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: '#ff6b35' }}></View>
                <Text className="text-xs text-gray-600">92号</Text>
              </View>
              <View className="flex items-center">
                <View className="w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: '#4facfe' }}></View>
                <Text className="text-xs text-gray-600">95号</Text>
              </View>
              <View className="flex items-center">
                <View className="w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: '#a18cd1' }}></View>
                <Text className="text-xs text-gray-600">98号</Text>
              </View>
              <View className="flex items-center">
                <View className="w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: '#00d2ff' }}></View>
                <Text className="text-xs text-gray-600">0号柴油</Text>
              </View>
            </View>

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
