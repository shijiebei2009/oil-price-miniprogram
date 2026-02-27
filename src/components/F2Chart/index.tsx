import Taro from '@tarojs/taro'
import { useEffect, useRef } from 'react'
import { View } from '@tarojs/components'
import * as F2 from '@antv/f2'
import './index.css'

interface F2ChartProps {
  data: any[]
  config: any
  height?: number
}

const F2Chart: React.FC<F2ChartProps> = ({ data, config, height = 300 }) => {
  const chartRef = useRef<any>(null)
  const canvasId = useRef(`f2-chart-${Date.now()}-${Math.random()}`)

  useEffect(() => {
    if (!data || data.length === 0) return

    console.log('F2Chart: 初始化图表', { dataLength: data.length, config })

    try {
      // 创建 Canvas
      const query = Taro.createSelectorQuery()
      query.select(`#${canvasId.current}`)
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res || !res[0]) {
            console.error('F2Chart: Canvas 节点未找到')
            return
          }

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

          // 创建 F2 图表（使用 any 绕过类型检查）
          const chartConfig: any = {
            width: canvasWidth,
            height: canvasHeight,
            padding: config.padding || 'auto'
          }

          // 创建图表实例
          const chart = new (F2 as any).Chart(chartConfig)

          // 手动设置 canvas 上下文
          ;(chart as any).container = canvas
          ;(chart as any).context = ctx

          // 设置数据
          ;(chart as any).source(data)

          // 配置坐标轴
          if (config.axis) {
            Object.keys(config.axis).forEach((key) => {
              ;(chart as any).axis(key, config.axis[key])
            })
          }

          // 配置提示框
          if (config.tooltip) {
            ;(chart as any).tooltip(config.tooltip)
          }

          // 配置图例
          if (config.legend) {
            ;(chart as any).legend(config.legend)
          }

          // 配置坐标系统
          if (config.coord) {
            const coord = (chart as any).coord()
            if (config.coord.type === 'polar') {
              coord.transpose()
            }
          }

          // 添加几何图形
          if (config.geoms && Array.isArray(config.geoms)) {
            config.geoms.forEach((geomConfig: any) => {
              const geom = (chart as any)[geomConfig.type]()
                .position(geomConfig.position)

              if (geomConfig.color) {
                geom.color(geomConfig.color)
              }

              if (geomConfig.shape) {
                geom.shape(geomConfig.shape)
              }

              if (geomConfig.size) {
                geom.size(geomConfig.size)
              }

              if (geomConfig.adjust) {
                geom.adjust(geomConfig.adjust)
              }

              if (geomConfig.style) {
                geom.style(geomConfig.style)
              }
            })
          }

          // 渲染图表
          ;(chart as any).render()

          // 保存图表实例
          chartRef.current = chart

          console.log('F2Chart: 图表渲染成功')
        })
    } catch (error) {
      console.error('F2Chart: 图表初始化失败', error)
    }

    return () => {
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
  }, [data, config, height])

  return (
    <View className="f2-chart-container" style={{ height: `${height}px` }}>
      <canvas id={canvasId.current} className="f2-canvas" style={{ width: '100%', height: '100%' }} />
    </View>
  )
}

export default F2Chart
