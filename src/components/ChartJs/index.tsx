import { View, Text, Canvas } from '@tarojs/components'
import { useEffect, useRef } from 'react'
import Taro from '@tarojs/taro'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

// 注册所有需要的组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface ChartJsProps {
  data: any[]
  config: any
  height?: number
}

const ChartJs: React.FC<ChartJsProps> = ({ data, config, height = 300 }) => {
  const chartRef = useRef<any>(null)
  const canvasId = useRef(`chart-canvas-${Date.now()}-${Math.random()}`)

  // 转换数据格式（从 F2 格式转换为 Chart.js 格式）
  const labels = data.map((item: any) => item.date)
  const datasets: any[] = []

  // 根据配置添加数据集
  if (config.geoms && Array.isArray(config.geoms)) {
    config.geoms.forEach((geomConfig: any) => {
      const key = geomConfig.position.split('*')[1] // 提取字段名
      const color = geomConfig.color

      datasets.push({
        label: config.dataMapping?.[key] || key,
        data: data.map((item: any) => item[key]),
        borderColor: color,
        backgroundColor: color,
        tension: 0.4,
        fill: false,
        pointRadius: 2,
        pointHoverRadius: 4
      } as any)
    })
  }

  const chartData = {
    labels,
    datasets
  }

  const options = {
    responsive: false,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: config.legend !== false,
        position: 'top' as const
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: false
      }
    },
    animation: {
      duration: 0
    }
  }

  // 初始化图表
  useEffect(() => {
    if (!data || data.length === 0) return

    const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP

    const initChart = () => {
      try {
        // 销毁旧图表
        if (chartRef.current) {
          chartRef.current.destroy()
          chartRef.current = null
        }

        let ctx: any

        if (isWeapp) {
          // 小程序端使用 Taro Canvas 2D
          const query = Taro.createSelectorQuery()
          query.select(`#${canvasId.current}`)
            .fields({ node: true, size: true })
            .exec((res: any) => {
              if (res && res[0]) {
                const canvas = res[0].node
                ctx = canvas.getContext('2d')

                // 设置 Canvas 尺寸
                const dpr = Taro.getSystemInfoSync().pixelRatio || 1
                canvas.width = res[0].width * dpr
                canvas.height = res[0].height * dpr
                ctx.scale(dpr, dpr)

                // 创建图表
                chartRef.current = new ChartJS(ctx, {
                  type: 'line',
                  data: chartData,
                  options: {
                    ...options,
                    responsive: true,
                    maintainAspectRatio: false
                  }
                })
              }
            })
        } else {
          // H5 端使用标准 Canvas
          const canvasEl = document.getElementById(canvasId.current) as HTMLCanvasElement
          if (canvasEl) {
            ctx = canvasEl.getContext('2d')
            if (ctx) {
              chartRef.current = new ChartJS(ctx, {
                type: 'line',
                data: chartData,
                options: {
                  ...options,
                  responsive: true,
                  maintainAspectRatio: false
                }
              })
            }
          }
        }
      } catch (error) {
        console.error('ChartJs: 初始化图表失败', error)
      }
    }

    // 延迟初始化确保 DOM 已渲染
    const timer = setTimeout(initChart, 100)

    return () => {
      clearTimeout(timer)
      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, config, height])

  if (!data || data.length === 0) {
    return (
      <View className="w-full flex items-center justify-center" style={{ height: `${height}px` }}>
        <Text className="block text-sm text-gray-500">暂无数据</Text>
      </View>
    )
  }

  const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP

  if (isWeapp) {
    // 小程序端使用 Taro Canvas 2D
    return (
      <View
        className="w-full"
        style={{ height: `${height}px`, position: 'relative' }}
      >
        <Canvas
          id={canvasId.current}
          type="2d"
          style={{ width: '100%', height: '100%' }}
        />
      </View>
    )
  } else {
    // H5 端使用标准 Canvas
    return (
      <View
        className="w-full"
        style={{ height: `${height}px`, position: 'relative' }}
      >
        <canvas
          id={canvasId.current}
          style={{ width: '100%', height: '100%' }}
        />
      </View>
    )
  }
}

export default ChartJs
