import { View, Canvas } from '@tarojs/components'
import { useEffect, useRef, useState } from 'react'
import Taro from '@tarojs/taro'
import uCharts from '@qiun/ucharts'

interface UChartsProps {
  data: Array<{
    date: string
    gas92: number
    gas95: number
    gas98: number
    diesel0: number
  }>
}

const UCharts: React.FC<UChartsProps> = ({ data }) => {
  const [canvasId] = useState(`ucharts-${Date.now()}-${Math.floor(Math.random() * 10000)}`)
  const [canvasWidth, setCanvasWidth] = useState(0)
  const [canvasHeight, setCanvasHeight] = useState(0)
  const uChartsRef = useRef<any>(null)

  useEffect(() => {
    if (!data || data.length === 0) {
      return
    }

    // 获取屏幕信息
    const systemInfo = Taro.getSystemInfoSync()
    const screenWidth = systemInfo.windowWidth
    const screenHeight = systemInfo.windowHeight

    // 延迟初始化，确保容器已经渲染完成
    setTimeout(() => {
      // 获取容器的实际尺寸
      const query = Taro.createSelectorQuery()
      query.select(`#chart-container`)
        .fields({ size: true })
        .exec((res: any) => {
          if (res && res[0]) {
            const { width: containerWidth, height: containerHeight } = res[0]

            // 使用容器的实际尺寸
            const width = containerWidth
            const height = containerHeight

            setCanvasWidth(width)
            setCanvasHeight(height)

            console.log('UCharts: 获取容器尺寸', {
              dataLength: data.length,
              canvasId,
              containerWidth,
              containerHeight,
              chartWidth: width,
              chartHeight: height,
              aspectRatio: width / height
            })

            // 初始化图表
            setTimeout(() => {
              initChart(width, height)
            }, 100)
          } else {
            console.error('UCharts: 无法获取容器尺寸，使用屏幕尺寸')
            // 降级方案：使用屏幕尺寸
            const width = screenWidth
            const height = screenHeight * 0.65
            setCanvasWidth(width)
            setCanvasHeight(height)
            setTimeout(() => {
              initChart(width, height)
            }, 100)
          }
        })
    }, 500)

    return () => {
      // 清理图表实例
      if (uChartsRef.current) {
        uChartsRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, canvasId])

  const initChart = (width: number, height: number) => {
    const query = Taro.createSelectorQuery()
    query.select(`#${canvasId}`)
      .fields({ node: true, size: true })
      .exec((res: any) => {
        console.log('UCharts: Canvas 查询结果', res)

        if (res && res[0]) {
          const { node: canvas } = res[0]

          if (!canvas) {
            console.error('UCharts: Canvas 节点不存在')
            return
          }

          const dpr = Taro.getSystemInfoSync().pixelRatio || 1

          // 设置 Canvas 尺寸
          canvas.width = width * dpr
          canvas.height = height * dpr

          // 上下文
          const ctx = canvas.getContext('2d')

          // 准备数据
          const categories = data.map(item => item.date.substring(5)) // 只显示月-日

          // 计算数据的最小值和最大值，动态设置 Y 轴范围
          const allPrices = data.flatMap(item => [item.gas92, item.gas95, item.gas98, item.diesel0])
          const minPrice = Math.min(...allPrices)
          const maxPrice = Math.max(...allPrices)
          const priceRange = maxPrice - minPrice

          // Y 轴范围：直接使用数据范围，留 3% 空间，让折线占更多
          const yMin = minPrice - priceRange * 0.03
          const yMax = maxPrice + priceRange * 0.03

          const series = [
            {
              name: '92#汽油',
              data: data.map(item => item.gas92),
              color: '#f59e0b'
            },
            {
              name: '95#汽油',
              data: data.map(item => item.gas95),
              color: '#3b82f6'
            },
            {
              name: '98#汽油',
              data: data.map(item => item.gas98),
              color: '#8b5cf6'
            },
            {
              name: '0#柴油',
              data: data.map(item => item.diesel0),
              color: '#10b981'
            }
          ]

          console.log('UCharts: 配置信息', {
            minPrice,
            maxPrice,
            priceRange,
            yMin,
            yMax,
            canvasWidth: width,
            canvasHeight: height,
            padding: [8, 0, 8, 35],
            示例数据: data[0],
            series数据: series.map(s => ({
              name: s.name,
              数据点数: s.data.length,
              前3个数据点: s.data.slice(0, 3)
            }))
          })

          // uCharts 配置
          const option = {
            type: 'line',
            canvasId: canvasId,
            width: width,
            height: height,
            padding: [8, 0, 8, 35],  // padding：顶8，右0，底8，左35（减少左侧占用）
            animation: false,  // 禁用动画，避免错误
            background: '#FFFFFF',
            color: ['#1890ff', '#52c41a', '#faad14', '#8c8c8c'],
            categories,
            series,
            xAxis: {
              disableGrid: true,
              itemCount: data.length,
              labelCount: Math.min(6, data.length),
              fontSize: 14,
              margin: 8,
              scrollAlign: 'center'
            },
            yAxis: {
              disableGrid: true,
              data: [{ min: yMin, max: yMax }],  // 使用 data 格式
              fontSize: 14,
              margin: 8,
              format: (val: number) => val.toFixed(2)
            },
            legend: {
              show: false
            },
            tooltip: {
              show: true,
              format: {
                title: (name: string) => name,
                items: (item: any) => {
                  return `${item.name}: ¥${item.data.toFixed(2)}/L`
                }
              }
            },
            extra: {
              line: {
                type: 'curve',
                width: 2
              }
            }
          }

          // 初始化图表
          uChartsRef.current = new uCharts({
            $this: this,
            canvasId: canvasId,
            context: ctx,
            type: option.type,
            fontSize: 14,
            legend: option.legend,
            background: option.background,
            pixelRatio: dpr,
            categories: option.categories,
            series: option.series,
            animation: option.animation,
            xAxis: option.xAxis,
            yAxis: option.yAxis,
            dataLabel: false,
            width: width,
            height: height,
            padding: option.padding,
            extra: option.extra,
            tooltip: option.tooltip  // 添加 tooltip 配置
          })

          console.log('UCharts: 图表创建成功', {
            实际配置: {
              width,
              height,
              padding: option.padding,
              yAxis: option.yAxis,
              xAxis: option.xAxis
            }
          })
        }
      })
  }

  return (
    <View style={{ width: '100%', height: `${canvasHeight}px` }}>
      <Canvas
        id={canvasId}
        canvasId={canvasId}
        type="2d"
        style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}
      />
    </View>
  )
}

export default UCharts
