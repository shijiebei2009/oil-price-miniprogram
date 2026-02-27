import { View, Text } from '@tarojs/components'
import UCharts from '@/components/UCharts'
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

const PriceChart: React.FC<PriceChartProps> = ({ data }) => {
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
      {/* 图表区域 */}
      <View className="chart-container">
        <UCharts data={data} />
      </View>
    </View>
  )
}

export default PriceChart
