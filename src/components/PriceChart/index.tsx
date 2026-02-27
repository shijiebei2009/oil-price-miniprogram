import { View, Text } from '@tarojs/components'
import F2Chart from '@/components/F2Chart'
import './index.css'

interface PriceChartProps {
  data: Array<{
    date: string
    price92: number
    price95: number
    price98: number
    priceDiesel: number
  }>
  height?: number
}

const PriceChart: React.FC<PriceChartProps> = ({ data, height = 300 }) => {
  // 转换数据格式为 F2 需要的格式
  const formatData = (chartData: typeof data) => {
    const result: any[] = []
    chartData.forEach((item) => {
      result.push({ date: item.date, type: '92#汽油', value: item.price92 })
      result.push({ date: item.date, type: '95#汽油', value: item.price95 })
      result.push({ date: item.date, type: '98#汽油', value: item.price98 })
      result.push({ date: item.date, type: '0#柴油', value: item.priceDiesel })
    })
    return result
  }

  const chartData = formatData(data)

  // F2 图表配置
  const chartConfig = {
    padding: ['auto', 'auto', '60', 'auto'],
    tooltip: {
      showCrosshairs: true,
      showItemMarker: true,
      onShow: (ev: any) => {
        const { items } = ev
        items[0].name = items[0].title
        items[0].value = items[0].value
      }
    },
    legend: {
      position: 'bottom',
      align: 'center',
      itemGap: 15,
      itemWidth: 10,
      itemHeight: 10
    },
    axis: {
      date: {
        range: [0, 1]
      }
    },
    geoms: [
      {
        type: 'line',
        position: 'date*value',
        color: 'type',
        shape: 'smooth',
        size: 2,
        style: {
          lineWidth: 2
        }
      }
    ]
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

      {/* 图表区域 - H5 和小程序端都使用 F2Chart */}
      <View className="chart-container">
        <F2Chart
          data={chartData}
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
