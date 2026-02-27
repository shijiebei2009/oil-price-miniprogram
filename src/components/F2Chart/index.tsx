import Taro from '@tarojs/taro'
import { useEffect, useRef, useState } from 'react'
import { View, Canvas, Text } from '@tarojs/components'
import { Chart } from '@antv/f2'
import './index.css'

interface F2ChartProps {
  data: any[]
  config: any
  height?: number
}

const F2Chart: React.FC<F2ChartProps> = ({ data, config, height = 300 }) => {
  const chartRef = useRef<any>(null)
  const [canvasId] = useState(() => `f2-chart-${Date.now()}`)
  const [isReady, setIsReady] = useState(false)
  const retryCount = useRef(0)
  const MAX_RETRY = 3

  const initChart = () => {
    if (!data || data.length === 0) {
      console.warn('F2Chart: 数据为空，跳过初始化')
      return
    }

    console.log('F2Chart: 初始化图表', { dataLength: data.length, canvasId })

    const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP

    try {
      if (isWeapp) {
        // 微信小程序端：使用 createSelectorQuery 获取 Canvas 节点
        const query = Taro.createSelectorQuery()
        query.select(`#${canvasId}`)
          .fields({ node: true, size: true })
          .exec((res) => {
            if (!res || !res[0]) {
              console.error('F2Chart: Canvas 节点未找到', { canvasId, res })

              // 重试逻辑
              retryCount.current++
              if (retryCount.current < MAX_RETRY) {
                console.log(`F2Chart: 第 ${retryCount.current} 次重试...`)
                setTimeout(initChart, 300)
              } else {
                console.error('F2Chart: 超过最大重试次数')
              }
              return
            }

            console.log('F2Chart: Canvas 节点查询成功', res[0])

            const canvas = res[0].node
            const canvasWidth = res[0].width
            const canvasHeight = res[0].height

            console.log('F2Chart: Canvas 尺寸', { width: canvasWidth, height: canvasHeight })

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
            console.error('F2Chart: Canvas 元素未找到', { canvasId })

            // 重试逻辑
            retryCount.current++
            if (retryCount.current < MAX_RETRY) {
              console.log(`F2Chart: 第 ${retryCount.current} 次重试...`)
              setTimeout(initChart, 300)
            } else {
              console.error('F2Chart: 超过最大重试次数')
            }
            return
          }

          console.log('F2Chart: Canvas 元素获取成功')

          const canvasWidth = canvasElement.clientWidth
          const canvasHeight = canvasElement.clientHeight

          console.log('F2Chart: Canvas 尺寸', { width: canvasWidth, height: canvasHeight })

          // 获取 Canvas Context
          const ctx = canvasElement.getContext('2d')

          if (!ctx) {
            console.error('F2Chart: 无法获取 Canvas Context')
            return
          }

          // 设置 Canvas 尺寸（H5 端考虑 devicePixelRatio）
          const dpr = window.devicePixelRatio || 1
          canvasElement.width = canvasWidth * dpr
          canvasElement.height = canvasHeight * dpr
          ctx.scale(dpr, dpr)

          renderChart(canvasElement, ctx, canvasWidth, canvasHeight)
        }, 100)
      }
    } catch (error) {
      console.error('F2Chart: 图表初始化失败', error)
    }
  }

  const renderChart = (canvas: any, ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
    try {
      console.log('F2Chart: 开始渲染图表', { dataLength: data.length, canvasWidth, canvasHeight })

      // 获取 pixelRatio（兼容小程序和 H5）
      const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP
      const pixelRatio = isWeapp
        ? (Taro.getSystemInfoSync().pixelRatio || 1)
        : (window.devicePixelRatio || 1)

      // F2 v4 正确的初始化方式 - 使用 el 参数
      const chart = new Chart({
        el: canvas,
        width: canvasWidth,
        height: canvasHeight,
        padding: config.padding || 'auto',
        pixelRatio
      })

      console.log('F2Chart: 图表实例创建成功', { pixelRatio })

      // 设置数据
      chart.source(data)

      console.log('F2Chart: 数据源设置成功')

      // 配置坐标轴
      if (config.axis) {
        Object.keys(config.axis).forEach((key) => {
          chart.axis(key, config.axis[key])
        })
      }

      // 配置提示框
      if (config.tooltip) {
        chart.tooltip(config.tooltip)
      }

      // 配置图例
      if (config.legend) {
        chart.legend(config.legend)
      }

      // 添加几何图形
      if (config.geoms && Array.isArray(config.geoms)) {
        config.geoms.forEach((geomConfig: any) => {
          console.log('F2Chart: 添加几何图形', geomConfig)

          const geom = chart[geomConfig.type]()
            .position(geomConfig.position)

          // F2 v4 使用 .color() 方法设置颜色映射
          if (geomConfig.color) {
            geom.color(geomConfig.color)
          }

          // F2 v4 使用 .shape() 方法设置形状
          if (geomConfig.shape) {
            geom.shape(geomConfig.shape)
          }

          // F2 v4 使用 .size() 方法设置大小
          if (geomConfig.size) {
            geom.size(geomConfig.size)
          }

          // F2 v4 使用 .style() 方法设置样式
          if (geomConfig.style) {
            geom.style(geomConfig.style)
          }
        })
      }

      console.log('F2Chart: 开始调用 render()')
      // 渲染图表
      chart.render()

      // 保存图表实例
      chartRef.current = chart

      console.log('F2Chart: 图表渲染成功')
      setIsReady(true)
    } catch (error) {
      console.error('F2Chart: 渲染图表失败', error)
      console.error('错误堆栈:', error.stack)
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
        try {
          ;(chartRef.current as any).destroy()
        } catch (e) {
          console.error('F2Chart: 销毁图表失败', e)
        }
        chartRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, config, height])

  return (
    <View
      className="f2-chart-container"
      style={{ height: `${height}px`, position: 'relative' }}
    >
      {Taro.getEnv() === Taro.ENV_TYPE.WEAPP ? (
        // 微信小程序端：使用 2d Canvas
        <Canvas
          id={canvasId}
          type="2d"
          canvasId={canvasId}
          className="f2-canvas"
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      ) : (
        // H5 端：使用普通 Canvas
        <canvas
          id={canvasId}
          className="f2-canvas"
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

export default F2Chart
