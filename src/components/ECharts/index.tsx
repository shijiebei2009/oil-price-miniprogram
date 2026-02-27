import { View, Canvas } from '@tarojs/components'
import { useEffect, useRef, useState } from 'react'
import Taro from '@tarojs/taro'
import * as echarts from 'echarts/core'

// 引入需要的图表类型和组件
import {
  LineChart
} from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent
} from 'echarts/components'
import {
  CanvasRenderer
} from 'echarts/renderers'

// 注册必需的组件
echarts.use([
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  CanvasRenderer
])

interface EChartsProps {
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

const ECharts: React.FC<EChartsProps> = ({ data, height = 300 }) => {
  const chartRef = useRef<any>(null)
  const [canvasId] = useState(`echarts-canvas-${Date.now()}-${Math.floor(Math.random() * 10000)}`)
  const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP

  // 转换数据格式为 ECharts 格式
  const xAxisData = data.map(item => item.date)
  const series = [
    {
      name: '92#汽油',
      type: 'line',
      data: data.map(item => item.gas92),
      smooth: true,
      lineStyle: {
        color: '#1890ff',
        width: 2
      },
      itemStyle: {
        color: '#1890ff'
      }
    },
    {
      name: '95#汽油',
      type: 'line',
      data: data.map(item => item.gas95),
      smooth: true,
      lineStyle: {
        color: '#52c41a',
        width: 2
      },
      itemStyle: {
        color: '#52c41a'
      }
    },
    {
      name: '98#汽油',
      type: 'line',
      data: data.map(item => item.gas98),
      smooth: true,
      lineStyle: {
        color: '#faad14',
        width: 2
      },
      itemStyle: {
        color: '#faad14'
      }
    },
    {
      name: '0#柴油',
      type: 'line',
      data: data.map(item => item.diesel0),
      smooth: true,
      lineStyle: {
        color: '#8c8c8c',
        width: 2
      },
      itemStyle: {
        color: '#8c8c8c'
      }
    }
  ]

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      }
    },
    legend: {
      data: ['92#汽油', '95#汽油', '98#汽油', '0#柴油'],
      top: 10,
      padding: [5, 10, 5, 10]
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 60
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xAxisData,
      axisLabel: {
        rotate: 45,
        interval: 0,
        fontSize: 10
      }
    },
    yAxis: {
      type: 'value'
    },
    series
  }

  useEffect(() => {
    if (!data || data.length === 0) {
      return
    }

    console.log('ECharts: 初始化图表', {
      dataLength: data.length,
      canvasId,
      isWeapp
    })

    const initChart = () => {
      try {
        // 销毁旧图表
        if (chartRef.current) {
          chartRef.current.dispose()
          chartRef.current = null
        }

        if (isWeapp) {
          // 小程序端 - 使用 Canvas 2D
          const query = Taro.createSelectorQuery()
          query.select(`#${canvasId}`)
            .fields({ node: true, size: true })
            .exec((res: any) => {
              console.log('ECharts: Canvas 查询结果', res)

              if (res && res[0]) {
                const { node: canvas, width, height } = res[0]

                if (!canvas) {
                  console.error('ECharts: Canvas 节点不存在')
                  return
                }

                const dpr = Taro.getSystemInfoSync().pixelRatio || 1

                // 设置 Canvas 实际像素尺寸
                canvas.width = width * dpr
                canvas.height = height * dpr

                // 创建 2D context
                const ctx = canvas.getContext('2d')
                ctx.scale(dpr, dpr)

                // 使用 echarts-for-weixin 的方式初始化
                chartRef.current = echarts.init(canvas, null, {
                  width: width,
                  height: height,
                  devicePixelRatio: dpr,
                  renderer: 'canvas'
                })

                chartRef.current.setOption(option)
                console.log('ECharts: 图表创建成功（小程序端）')
              }
            })
        } else {
          // H5 端 - 使用原生 Canvas
          const canvasElement = document.getElementById(canvasId) as HTMLCanvasElement
          if (canvasElement) {
            chartRef.current = echarts.init(canvasElement)
            chartRef.current.setOption(option)
            console.log('ECharts: 图表创建成功（H5端）')
          }
        }
      } catch (error) {
        console.error('ECharts: 初始化失败', error)
      }
    }

    // 延迟初始化，确保 DOM 已渲染
    const timer = setTimeout(initChart, 100)

    return () => {
      clearTimeout(timer)
      // 清理图表实例
      if (chartRef.current) {
        chartRef.current.dispose()
        chartRef.current = null
      }
    }
  }, [data, canvasId, isWeapp])

  return (
    <View className="echarts-container" style={{ width: '100%', height: `${height}px` }}>
      {isWeapp ? (
        // 小程序端 - 使用 Canvas 2D
        <Canvas
          id={canvasId}
          type="2d"
          canvasId={canvasId}
          style={{ width: '100%', height: `${height}px` }}
        />
      ) : (
        // H5 端 - 使用原生 Canvas
        <Canvas
          id={canvasId}
          canvasId={canvasId}
          style={{ width: '100%', height: `${height}px` }}
        />
      )}
    </View>
  )
}

export default ECharts
