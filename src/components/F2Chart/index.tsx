import { View } from '@tarojs/components'
import FCanvasIndex from 'f-engine-taro-react'
import { Chart, Line, Axis, Tooltip, Legend } from '@antv/f2'

interface F2ChartProps {
  data: Array<{
    date: string
    gas92: number
    gas95: number
    gas98: number
    diesel0: number
  }>
  config: any
  height?: number
}

const F2Chart: React.FC<F2ChartProps> = ({ data, height = 300 }) => {
  // 为每个实例生成唯一的 Canvas ID
  const canvasId = `f2-chart-${Math.floor(Math.random() * 100000)}`

  // 转换数据格式为 F2 v5 格式（需要将多条线合并为一个数组）
  const chartData = data.flatMap(item => [
    { date: item.date, type: '92#汽油', price: item.gas92 },
    { date: item.date, type: '95#汽油', price: item.gas95 },
    { date: item.date, type: '98#汽油', price: item.gas98 },
    { date: item.date, type: '0#柴油', price: item.diesel0 }
  ])

  console.log('F2Chart: 数据转换完成', { dataLength: data.length, chartDataLength: chartData.length, sampleData: chartData[0] })

  return (
    <View className="w-full" style={{ height: `${height}px`, position: 'relative' }}>
      <View className="w-full" style={{ height: '100%' }}>
        <FCanvasIndex id={canvasId}>
          <Chart
            data={chartData}
            padding={[40, 20, 80, 60]}
          >
            <Axis field="date" />
            <Axis field="price" />
            <Line
              x="date"
              y="price"
              color={{
                field: 'type',
                range: ['#1890ff', '#52c41a', '#faad14', '#8c8c8c']
              }}
            />
            <Tooltip />
            <Legend />
          </Chart>
        </FCanvasIndex>
      </View>
    </View>
  )
}

export default F2Chart
