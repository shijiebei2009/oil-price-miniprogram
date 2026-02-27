import { View, Text } from '@tarojs/components'
import ECharts from '@/components/ECharts'
import Taro from '@tarojs/taro'
import './index.css'

interface PriceChartProps {
  data: Array<{
    date: string
    gas92: number
    gas95: number
    gas98: number
    diesel0: number
  }>
  height?: number
}

const PriceChart: React.FC<PriceChartProps> = ({ data, height = 300 }) => {
  const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP

  // 小程序端：显示数据列表
  if (isWeapp) {
    if (data.length === 0) {
      return (
        <View className="price-chart">
          <View className="chart-placeholder">
            <Text className="block text-gray-500 text-center">
              暂无数据
            </Text>
          </View>
        </View>
      )
    }

    return (
      <View className="price-chart">
        {/* 标题 */}
        <View className="chart-toolbar">
          <Text className="block text-base font-semibold text-gray-900 mb-2">
            价格走势
          </Text>
          <Text className="block text-xs text-gray-400">
            小程序端显示列表 · 数据每日更新
          </Text>
        </View>

        {/* 数据列表 */}
        <View className="mt-4 space-y-3">
          {data.map((item, index) => (
            <View key={index} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <View className="mb-3">
                <Text className="block text-sm font-medium text-gray-900">
                  {item.date}
                </Text>
              </View>
              <View className="grid grid-cols-2 gap-2">
                <View>
                  <Text className="block text-xs text-gray-500">92#汽油</Text>
                  <Text className="block text-sm font-semibold text-gray-900">
                    ¥{item.gas92.toFixed(2)}/L
                  </Text>
                </View>
                <View>
                  <Text className="block text-xs text-gray-500">95#汽油</Text>
                  <Text className="block text-sm font-semibold text-gray-900">
                    ¥{item.gas95.toFixed(2)}/L
                  </Text>
                </View>
                <View>
                  <Text className="block text-xs text-gray-500">98#汽油</Text>
                  <Text className="block text-sm font-semibold text-gray-900">
                    ¥{item.gas98.toFixed(2)}/L
                  </Text>
                </View>
                <View>
                  <Text className="block text-xs text-gray-500">0#柴油</Text>
                  <Text className="block text-sm font-semibold text-gray-900">
                    ¥{item.diesel0.toFixed(2)}/L
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    )
  }

  // H5 端：显示图表
  const chartConfig = {
    legend: true,
    tooltip: true
  }

  if (data.length === 0) {
    return (
      <View className="price-chart">
        <View className="chart-placeholder">
          <Text className="block text-gray-500 text-center">
            暂无数据
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View className="price-chart">
      {/* 工具栏 */}
      <View className="chart-toolbar">
        <Text className="block text-base font-semibold text-gray-900 mb-2">
          价格走势
        </Text>
      </View>

      {/* 图表区域 */}
      <View className="chart-container" style={{ height: `${height}px` }}>
        <ECharts
          data={data}
          config={chartConfig}
          height={height}
        />
      </View>

      {/* 提示信息 */}
      <View className="mt-3">
        <Text className="block text-xs text-gray-400 text-center">
          支持查看各油品价格走势 · 数据每日更新
        </Text>
      </View>
    </View>
  )
}

export default PriceChart
