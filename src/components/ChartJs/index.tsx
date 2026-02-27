import { View, Text, Canvas } from '@tarojs/components'
import { useEffect, useRef, useState } from 'react'
import Taro from '@tarojs/taro'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Line } from 'react-chartjs-2'

// 注册所有需要的组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
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
  // 生成不含小数点的唯一 Canvas ID
  const [canvasId] = useState(() => {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 10000)
    return `chart-canvas-${timestamp}-${random}`
  })

  const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP

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
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: config.legend !== false,
        position: 'top' as const,
        labels: {
          padding: 10,
          usePointStyle: true
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        padding: 12
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          padding: 10,
          maxTicksLimit: 10
        }
      },
      y: {
        beginAtZero: false,
        ticks: {
          padding: 10
        }
      }
    },
    layout: {
      padding: {
        top: 10,
        bottom: 5,
        left: 10,
        right: 10
      }
    },
    animation: {
      duration: 0
    }
  }

  // 初始化图表
  useEffect(() => {
    console.log('ChartJs: useEffect 触发', {
      dataLength: data.length,
      canvasId,
      isWeapp,
      hasCanvasRef: !!chartRef.current
    })

    // H5 端由 react-chartjs-2 自动处理
    if (!isWeapp) {
      return
    }

    // 小程序端需要手动初始化
    const initChart = () => {
      try {
        console.log('ChartJs: 开始初始化小程序图表')

        // 销毁旧图表
        if (chartRef.current) {
          console.log('ChartJs: 销毁旧图表')
          chartRef.current.destroy()
          chartRef.current = null
        }

        const query = Taro.createSelectorQuery()
        query.select(`#${canvasId}`)
          .fields({ node: true, size: true })
          .exec((res: any) => {
            console.log('ChartJs: Canvas 查询结果', res)

            if (res && res[0] && res[0].node) {
              const canvas = res[0].node
              const ctx = canvas.getContext('2d')

              console.log('ChartJs: 获取 Canvas 上下文成功', {
                width: res[0].width,
                height: res[0].height
              })

              // CRITICAL: 添加 canvas 引用到 context（Chart.js 需要）
              // Chart.js 会通过 ctx.canvas 访问 canvas 元素
              ctx.canvas = canvas

              // CRITICAL: 添加 Chart.js 需要的方法到 mini-program canvas
              // Chart.js 会调用这些方法
              canvas.getAttribute = (attr: string) => {
                if (attr === 'width') return canvas.width.toString()
                if (attr === 'height') return canvas.height.toString()
                return null
              }

              // 设置 Canvas 尺寸
              const dpr = Taro.getSystemInfoSync().pixelRatio || 1
              canvas.width = res[0].width * dpr
              canvas.height = res[0].height * dpr
              ctx.scale(dpr, dpr)

              // 创建图表
              console.log('ChartJs: 创建 Chart.js 实例')

              chartRef.current = new ChartJS(ctx, {
                type: 'line',
                data: chartData,
                options
              })

              console.log('ChartJs: 图表创建成功')
            } else {
              console.error('ChartJs: Canvas 查询失败', res)
            }
          })
      } catch (error) {
        console.error('ChartJs: 初始化图表失败', error)
      }
    }

    // 延迟初始化确保 DOM 已渲染
    const timer = setTimeout(initChart, 500)

    return () => {
      clearTimeout(timer)
      if (chartRef.current) {
        chartRef.current.destroy()
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

  console.log('ChartJs: 渲染 Canvas', { canvasId, isWeapp, height })

  if (isWeapp) {
    // 小程序端使用 Taro Canvas 2D
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
    // H5 端使用 react-chartjs-2
    return (
      <View
        className="w-full"
        style={{ height: `${height}px`, position: 'relative' }}
      >
        <Line ref={chartRef} data={chartData} options={options} />
      </View>
    )
  }
}

export default ChartJs
