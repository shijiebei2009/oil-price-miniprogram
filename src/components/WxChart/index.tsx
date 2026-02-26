import { useEffect, useRef } from 'react'
import { View } from '@tarojs/components'
import * as echarts from 'echarts'
import './index.css'

interface WxChartProps {
  option: echarts.EChartsOption
  height?: number
  onReady?: () => void
}

const WxChart: React.FC<WxChartProps> = ({ option, height = 300, onReady }) => {
  const ecRef = useRef<any>(null)
  const chartRef = useRef<any>(null)

  useEffect(() => {
    if (option && ecRef.current) {
      if (chartRef.current) {
        chartRef.current.setOption(option)
      }
    }
  }, [option])

  const initChart = (canvas: any, width: number, heightValue: number) => {
    const chart = echarts.init(canvas, null, {
      width: width,
      height: heightValue,
      devicePixelRatio: 1
    })

    chart.setOption(option)
    chartRef.current = chart

    if (onReady) {
      onReady()
    }

    return chart
  }

  return (
    <View style={{ width: '100%', height: `${height}px` }}>
      {/* @ts-ignore */}
      <ec-canvas
        id="mychart-dom-bar"
        canvas-id="mychart-bar"
        ec={{
          onInit: initChart
        }}
      />
    </View>
  )
}

export default WxChart
