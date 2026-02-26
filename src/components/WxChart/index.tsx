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
  const chartRef = useRef<any>(null)
  const optionRef = useRef<echarts.EChartsOption>(option)

  // 保存最新的 option 到 ref
  useEffect(() => {
    optionRef.current = option
  }, [option])

  useEffect(() => {
    if (optionRef.current && chartRef.current) {
      console.log('WxChart: 更新图表选项', optionRef.current)
      try {
        chartRef.current.setOption(optionRef.current)
      } catch (error) {
        console.error('WxChart: 设置图表选项失败', error)
      }
    }
  }, [])

  const initChart = (canvas: any, width: number, heightValue: number) => {
    console.log('WxChart: 初始化图表', { width, height: heightValue })

    try {
      const chart = echarts.init(canvas, null, {
        width: width,
        height: heightValue,
        devicePixelRatio: 1
      })

      console.log('WxChart: ECharts 实例创建成功', optionRef.current)
      chart.setOption(optionRef.current)
      chartRef.current = chart

      if (onReady) {
        onReady()
      }

      return chart
    } catch (error) {
      console.error('WxChart: 图表初始化失败', error)
      throw error
    }
  }

  return (
    <View style={{ width: '100%', height: `${height}px` }}>
      {/* @ts-ignore */}
      <ec-canvas
        id={`mychart-dom-${Math.random().toString(36).substr(2, 9)}`}
        canvas-id={`mychart-canvas-${Math.random().toString(36).substr(2, 9)}`}
        ec={{
          onInit: initChart,
          lazyLoad: false
        }}
      />
    </View>
  )
}

export default WxChart
