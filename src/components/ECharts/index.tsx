import { View, Canvas, Text } from '@tarojs/components'
import { useEffect, useRef } from 'react'
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
  CanvasRenderer  // 注册 Canvas 渲染器
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
  const canvasId = `echarts-canvas-${Date.now()}-${Math.floor(Math.random() * 10000)}`
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

  // 创建兼容的 Canvas 对象（小程序端）
  const createCompatibleCanvas = (canvasNode: any, width: number, height: number, dpr: number) => {
    // 设置小程序 Canvas 尺寸
    canvasNode.width = width * dpr
    canvasNode.height = height * dpr

    // 创建兼容层，添加 ECharts 需要的 DOM 方法
    const compatibleCanvas: any = {
      node: canvasNode,
      width: width,
      height: height,
      style: {
        width: `${width}px`,
        height: `${height}px`
      },
      // ECharts 需要的 DOM 方法
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
      getBoundingClientRect: () => ({
        width: width,
        height: height,
        top: 0,
        left: 0,
        right: width,
        bottom: height
      }),
      getContext: (contextType: string) => {
        return canvasNode.getContext(contextType)
      },
      // 其他 ECharts 可能需要的属性
      tagName: 'CANVAS',
      id: canvasId
    }

    return compatibleCanvas
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
          // 小程序端
          Taro.createSelectorQuery()
            .select(`#${canvasId}`)
            .fields({ node: true, size: true })
            .exec((res: any) => {
              console.log('ECharts: Canvas 查询结果', res)

              if (res && res[0] && res[0].node) {
                const canvasNode = res[0].node
                const dpr = Taro.getSystemInfoSync().pixelRatio || 1

                // 创建兼容的 Canvas 对象
                const compatibleCanvas = createCompatibleCanvas(
                  canvasNode,
                  res[0].width,
                  res[0].height,
                  dpr
                )

                // ECharts 小程序端初始化
                chartRef.current = echarts.init(compatibleCanvas, null, {
                  renderer: 'canvas',
                  width: res[0].width,
                  height: res[0].height,
                  devicePixelRatio: dpr
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

    // 延迟初始化
    const timer = setTimeout(initChart, 300)

    return () => {
      clearTimeout(timer)
      if (chartRef.current) {
        chartRef.current.dispose()
        chartRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, canvasId, isWeapp])

  if (!data || data.length === 0) {
    return (
      <View className="w-full flex items-center justify-center" style={{ height: `${height}px` }}>
        <Text className="block text-sm text-gray-500">暂无数据</Text>
      </View>
    )
  }

  console.log('ECharts: 渲染 Canvas', { canvasId, isWeapp, height })

  if (isWeapp) {
    // 小程序端
    return (
      <View
        className="w-full"
        style={{ height: `${height}px`, position: 'relative' }}
      >
        <Canvas
          id={canvasId}
          canvasId={canvasId}
          type="2d"
          style={{ width: '100%', height: '100%' }}
        />
      </View>
    )
  } else {
    // H5 端
    return (
      <View
        className="w-full"
        style={{ height: `${height}px`, position: 'relative' }}
      >
        <canvas
          id={canvasId}
          style={{ width: '100%', height: '100%' }}
        />
      </View>
    )
  }
}

export default ECharts
