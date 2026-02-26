import { useEffect, useRef } from 'react'
import { View } from '@tarojs/components'
import * as echarts from 'echarts-for-weixin'  // 🔴 使用 echarts-for-weixin 而不是 echarts
import './index.css'

interface WxChartProps {
  option: echarts.EChartsOption
  height?: number
  onReady?: () => void
  canvasId?: string
}

const WxChart: React.FC<WxChartProps> = ({ option, height = 300, onReady, canvasId = 'mychart-canvas' }) => {
  const chartRef = useRef<any>(null)
  const optionRef = useRef<echarts.EChartsOption>(option)

  // 保存最新的 option 到 ref
  useEffect(() => {
    optionRef.current = option
    console.log('WxChart: option 更新', option)
  }, [option])

  useEffect(() => {
    if (optionRef.current && chartRef.current) {
      console.log('WxChart: 更新图表选项', optionRef.current)
      try {
        chartRef.current.setOption(optionRef.current, true) // 添加 notMerge 参数
      } catch (error) {
        console.error('WxChart: 设置图表选项失败', error)
      }
    }
  }, [option])

  const initChart = (canvas: any, width: number, heightValue: number) => {
    console.log('WxChart: 初始化图表', {
      width,
      height: heightValue,
      canvasId,
      canvasType: typeof canvas,
      dataLength: optionRef.current?.series?.[0]?.data?.length
    })

    if (!canvas) {
      console.error('WxChart: canvas 参数为空')
      return null
    }

    try {
      const chart = echarts.init(canvas, null, {
        width: width,
        height: heightValue,
        devicePixelRatio: 1
      })

      console.log('WxChart: ECharts 实例创建成功')
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
    <View className="wx-chart-container" style={{ '--chart-height': `${height}px` } as React.CSSProperties}>
      {/* @ts-ignore */}
      <ec-canvas
        id={canvasId}
        canvas-id={canvasId}
        ec={{
          onInit: initChart,
          lazyLoad: false
        }}
      />
    </View>
  )
}

export default WxChart
