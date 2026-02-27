import { View, Text } from '@tarojs/components'
import F2Chart from '@/components/F2Chart'
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
  // F2 图表配置（现在 F2Chart 会自动处理）
  const chartConfig = {
    padding: [40, 20, 80, 60],
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
      <View className="chart-container">
        <F2Chart
          data={data}
          config={chartConfig}
          height={height}
        />
      </View>

      {/* 提示信息 */}
      <Text className="block text-xs text-gray-400 text-center mt-2">
        支持查看各油品价格走势 · 数据每日更新
      </Text>
    </View>
  )
}

export default PriceChart
