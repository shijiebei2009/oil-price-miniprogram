import Taro from '@tarojs/taro'
import { useEffect, useRef, useState } from 'react'
import { View, Canvas, Text } from '@tarojs/components'
import { Chart } from 'chart.js'
import './index.css'

interface ChartJsProps {
  data: any[]
  config: any
  height?: number
}

const ChartJs: React.FC<ChartJsProps> = ({ data, config, height = 300 }) => {
  const chartRef = useRef<Chart | null>(null)
  const [canvasId] = useState(() => `chart-js-${Date.now()}`)
  const [isReady, setIsReady] = useState(false)
  const retryCount = useRef(0)
  const MAX_RETRY = 3

  const initChart = () => {
    if (!data || data.length === 0) {
      console.warn('ChartJs: 数据为空，跳过初始化')
      return
    }

    console.log('ChartJs: 初始化图表', { dataLength: data.length, canvasId })

    const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP

    try {
      if (isWeapp) {
        // 微信小程序端：使用 createSelectorQuery 获取 Canvas 节点
        const query = Taro.createSelectorQuery()
        query.select(`#${canvasId}`)
          .fields({ node: true, size: true })
          .exec((res) => {
            if (!res || !res[0]) {
              console.error('ChartJs: Canvas 节点未找到', { canvasId, res })

              // 重试逻辑
              retryCount.current++
              if (retryCount.current < MAX_RETRY) {
                console.log(`ChartJs: 第 ${retryCount.current} 次重试...`)
                setTimeout(initChart, 300)
              } else {
                console.error('ChartJs: 超过最大重试次数')
              }
              return
            }

            console.log('ChartJs: Canvas 节点查询成功', res[0])

            const canvas = res[0].node
            const canvasWidth = res[0].width
            const canvasHeight = res[0].height

            console.log('ChartJs: Canvas 尺寸', { width: canvasWidth, height: canvasHeight })

            // 获取 Canvas Context
            const ctx = canvas.getContext('2d')

            // 设置 Canvas 尺寸
            const dpr = Taro.getSystemInfoSync().pixelRatio || 1
            canvas.width = canvasWidth * dpr
            canvas.height = canvasHeight * dpr
            ctx.scale(dpr, dpr)

            renderChart(canvas, ctx, canvasWidth, canvasHeight)
          })
      } else {
        // H5 端：直接获取 DOM 元素
        setTimeout(() => {
          const canvasElement = document.getElementById(canvasId) as HTMLCanvasElement

          if (!canvasElement) {
            console.error('ChartJs: Canvas 元素未找到', { canvasId })

            // 重试逻辑
            retryCount.current++
            if (retryCount.current < MAX_RETRY) {
              console.log(`ChartJs: 第 ${retryCount.current} 次重试...`)
              setTimeout(initChart, 300)
            } else {
              console.error('ChartJs: 超过最大重试次数')
            }
            return
          }

          console.log('ChartJs: Canvas 元素获取成功')

          const canvasWidth = canvasElement.clientWidth
          const canvasHeight = canvasElement.clientHeight

          console.log('ChartJs: Canvas 尺寸', { width: canvasWidth, height: canvasHeight })

          // 获取 Canvas Context
          const ctx = canvasElement.getContext('2d')

          if (!ctx) {
            console.error('ChartJs: 无法获取 Canvas Context')
            return
          }

          renderChart(canvasElement, ctx, canvasWidth, canvasHeight)
        }, 100)
      }
    } catch (error) {
      console.error('ChartJs: 图表初始化失败', error)
    }
  }

  const renderChart = (canvas: HTMLCanvasElement, _ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
    try {
      console.log('ChartJs: 开始渲染图表', { dataLength: data.length, canvasWidth, canvasHeight })

      // 销毁旧的图表实例
      if (chartRef.current) {
        chartRef.current.destroy()
      }

      // 转换数据格式（从 F2 格式转换为 Chart.js 格式）
      const labels = data.map((item: any) => item.date)
      const datasets = []

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
            fill: false
          })
        })
      }

      // 创建图表
      chartRef.current = new Chart(_ctx, {
        type: 'line',
        data: {
          labels,
          datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: config.legend !== false,
              position: 'top'
            },
            tooltip: {
              mode: 'index',
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
      })

      console.log('ChartJs: 图表渲染成功')
      setIsReady(true)
    } catch (error) {
      console.error('ChartJs: 渲染图表失败', error)
      console.error('错误堆栈:', error instanceof Error ? error.stack : String(error))
      setIsReady(false)
    }
  }

  useEffect(() => {
    // 重置重试计数
    retryCount.current = 0
    setIsReady(false)

    // 延迟初始化，确保 Canvas 已渲染（小程序端需要更长时间）
    const timer = setTimeout(() => {
      initChart()
    }, 200)

    return () => {
      clearTimeout(timer)
      // 清理图表
      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }
    }
  }, [data, config])

  return (
    <View
      className="w-full"
      style={{ height: `${height}px`, position: 'relative' }}
    >
      {Taro.getEnv() === Taro.ENV_TYPE.WEAPP ? (
        // 微信小程序端：使用 2d Canvas
        <Canvas
          id={canvasId}
          type="2d"
          canvasId={canvasId}
          className="chart-js-canvas"
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      ) : (
        // H5 端：使用普通 Canvas
        <canvas
          id={canvasId}
          className="chart-js-canvas"
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      )}
      {!isReady && data.length > 0 && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.9)'
          }}
        >
          <Text className="block text-sm text-gray-500">加载图表中...</Text>
        </View>
      )}
    </View>
  )
}

export default ChartJs
