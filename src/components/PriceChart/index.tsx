import Taro from '@tarojs/taro'
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
  const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP

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

      {/* 图表区域 */}
      <View className="chart-container">
        {isWeapp ? (
          // 微信小程序端：使用 F2 图表
          <F2Chart
            data={chartData}
            config={chartConfig}
            height={height}
          />
        ) : (
          // H5 端：显示提示（H5 端暂时未实现）
          <View className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-xl" style={{ height: `${height}px` }}>
            <Text className="block text-6xl mb-4">📊</Text>
            <Text className="block text-base font-semibold text-gray-700 mb-2">
              图表功能已移至微信小程序
            </Text>
            <Text className="block text-sm text-gray-500 text-center px-8">
              请在微信小程序中查看图表，或使用下方列表查看详细价格
            </Text>
          </View>
        )}
      </View>

      {/* 提示信息 */}
      <Text className="block text-xs text-gray-400 text-center mt-2">
        {isWeapp ? '支持查看各油品价格走势 · 数据每日更新' : '数据已更新，可在下方列表查看详细价格'}
      </Text>
    </View>
  )
}

export default PriceChart
