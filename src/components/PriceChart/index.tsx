import { View, Text } from '@tarojs/components'
import ChartJs from '@/components/ChartJs'
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
  // Chart.js 图表配置
  const chartConfig = {
    padding: ['auto', 'auto', '60', 'auto'],
    geoms: [
      {
        type: 'line',
        position: '*gas92',
        color: '#1890ff',
        shape: 'smooth',
        size: 2
      },
      {
        type: 'line',
        position: '*gas95',
        color: '#52c41a',
        shape: 'smooth',
        size: 2
      },
      {
        type: 'line',
        position: '*gas98',
        color: '#faad14',
        shape: 'smooth',
        size: 2
      },
      {
        type: 'line',
        position: '*diesel0',
        color: '#8c8c8c',
        shape: 'smooth',
        size: 2
      }
    ],
    dataMapping: {
      gas92: '92#汽油',
      gas95: '95#汽油',
      gas98: '98#汽油',
      diesel0: '0#柴油'
    },
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
        {console.log('PriceChart: 传递给 ChartJs 的数据', { dataLength: data.length, sampleData: data[0] })}
        <ChartJs
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
