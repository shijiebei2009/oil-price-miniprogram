import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import { Network } from '@/network'
import './index.css'

interface CityData {
  name: string
  gas92: number
  gas95: number
  gas98: number
  diesel0: number
  diff: number
}

const CityPage = () => {
  const [loading, setLoading] = useState(true)
  const [cityData, setCityData] = useState<CityData[]>([])

  // 加载城市价格数据
  const loadCityData = async () => {
    try {
      setLoading(true)
      console.log('开始获取城市价格数据')

      const result = await Network.request({
        url: '/api/oil-price/provinces/compare',
        method: 'GET'
      })

      // 检查响应是否成功
      if (!result.success) {
        console.error('获取城市价格数据失败:', result.errorMsg)
        return
      }

      console.log('城市价格数据响应:', result.data)

      if (result.data?.code === 200 && result.data?.data) {
        setCityData(result.data.data)
        console.log('城市价格数据解析成功:', result.data.data)
      } else {
        console.error('城市价格数据格式错误:', result.data)
      }
    } catch (error) {
      console.error('获取城市价格数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 获取涨跌幅颜色
  const getDiffColor = (diff: number) => {
    if (diff > 0) return 'text-red-500'
    if (diff < 0) return 'text-green-500'
    return 'text-gray-500'
  }

  // 获取涨跌幅显示
  const getDiffDisplay = (diff: number) => {
    if (diff > 0) {
      return `+${diff.toFixed(3)}`
    } else if (diff < 0) {
      return `${diff.toFixed(3)}`
    }
    return '0.000'
  }

  useLoad(() => {
    console.log('城市对比页面加载')
    loadCityData()
  })

  return (
    <View className="w-full min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* 页面标题 */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <Text className="block text-lg font-bold text-gray-900">省份对比</Text>
        <Text className="block text-xs text-gray-500 mt-1">
          全国34个省级行政区价格对比
        </Text>
      </View>

      {/* 主要内容区域 */}
      <View className="px-4 py-3">
        {/* 加载状态 */}
        {loading && (
          <View className="flex items-center justify-center py-12">
            <Text className="text-sm text-gray-500">加载中...</Text>
          </View>
        )}

        {/* 城市列表 */}
        {!loading && cityData.length > 0 && (
          <View>
            {cityData.map((city, index) => (
              <View key={index} className="bg-white rounded-xl p-4 mb-3 shadow-sm">
                <View className="flex flex-row items-center justify-between mb-3">
                  <View>
                    <Text className="block text-base font-semibold text-gray-900">
                      {city.name}
                    </Text>
                  </View>
                  {city.diff !== 0 && (
                    <View
                      className={`px-3 py-1 rounded-full ${city.diff > 0 ? 'bg-red-50' : 'bg-green-50'}`}
                    >
                      <Text className={`text-sm font-semibold ${getDiffColor(city.diff)}`}>
                        {getDiffDisplay(city.diff)}
                      </Text>
                    </View>
                  )}
                </View>
                <View className="flex flex-row gap-3">
                  <View className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-3">
                    <Text className="block text-xs text-gray-500 mb-1">92号</Text>
                    <Text className="block text-base font-bold text-gray-900">
                      {city.gas92}
                    </Text>
                  </View>
                  <View className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-3">
                    <Text className="block text-xs text-gray-500 mb-1">95号</Text>
                    <Text className="block text-base font-bold text-gray-900">
                      {city.gas95}
                    </Text>
                  </View>
                  <View className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-3">
                    <Text className="block text-xs text-gray-500 mb-1">0号柴油</Text>
                    <Text className="block text-base font-bold text-gray-900">
                      {city.diesel0}
                    </Text>
                  </View>
                </View>
              </View>
            ))}

            {/* 说明信息 */}
            <View className="bg-blue-50 rounded-xl p-4 mt-4">
              <Text className="block text-xs text-blue-600 text-center">
                提示：价格差异基于全国均价对比，具体价格以当地加油站为准
              </Text>
            </View>
          </View>
        )}

        {/* 空状态 */}
        {!loading && cityData.length === 0 && (
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

export default CityPage
