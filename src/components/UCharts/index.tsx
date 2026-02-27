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
  height?: number
}

const UCharts: React.FC<UChartsProps> = ({ data, height: propHeight }) => {
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

    // 计算合理的图表尺寸
    // 宽度：减去左右 padding（16px * 2 = 32px）
    const width = screenWidth - 32
    // 高度：使用屏幕高度的 70%，让图表更突出
    const height = screenHeight * 0.7

    setCanvasWidth(width)
    setCanvasHeight(height)

    console.log('UCharts: 初始化图表', {
      dataLength: data.length,
      canvasId,
      screenWidth,
      screenHeight,
      chartWidth: width,
      chartHeight: height,
      aspectRatio: width / height
    })

    // 延迟初始化，确保 Canvas 渲染完成
    setTimeout(() => {
      initChart(width, height)
    }, 200)

    return () => {
      // 清理图表实例
      if (uChartsRef.current) {
        uChartsRef.current = null
      }
    }
  }, [data, canvasId])

  const initChart = (width: number, height: number) => {
    const query = Taro.createSelectorQuery()
    query.select(`#${canvasId}`)
      .fields({ node: true, size: true })
      .exec((res: any) => {
        console.log('UCharts: Canvas 查询结果', res)

        if (res && res[0]) {
          const { node: canvas, width: canvasW, height: canvasH } = res[0]

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
          const series = [
            {
              name: '92#汽油',
              data: data.map(item => item.gas92),
              color: '#1890ff'
            },
            {
              name: '95#汽油',
              data: data.map(item => item.gas95),
              color: '#52c41a'
            },
            {
              name: '98#汽油',
              data: data.map(item => item.gas98),
              color: '#faad14'
            },
            {
              name: '0#柴油',
              data: data.map(item => item.diesel0),
              color: '#8c8c8c'
            }
          ]

          // uCharts 配置
          const option = {
            type: 'line',
            canvasId: canvasId,
            width: width,
            height: height,
            padding: [12, 8, 10, 38],
            animation: true,
            background: '#FFFFFF',
            color: ['#1890ff', '#52c41a', '#faad14', '#8c8c8c'],
            categories,
            series,
            xAxis: {
              disableGrid: true,
              itemCount: data.length,
              labelCount: data.length,
              fontSize: 12,
              margin: 5,
              scrollAlign: 'left'
            },
            yAxis: {
              gridType: 'dash',
              dashLength: 2,
              data: [{ min: 0, max: 10 }],
              fontSize: 12,
              margin: 5,
              format: (val: number) => val.toFixed(2)
            },
            extra: {
              line: {
                type: 'curve',
                width: 4,
                activeType: 'hollow',
                activeWidth: 5
              }
            },
            legend: {
              show: true,
              position: 'top',
              padding: 5,
              margin: 2,
              fontSize: 12,
              lineHeight: 14,
              float: 'center'
            },
            tooltip: {
              show: true,
              format: {
                title: (name: string) => name,
                items: (item: any) => {
                  return `${item.name}: ¥${item.data.toFixed(2)}/L`
                }
              }
            }
          }

          // 初始化图表
          uChartsRef.current = new uCharts({
            $this: this,
            canvasId: canvasId,
            context: ctx,
            type: option.type,
            fontSize: 13,
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
            extra: option.extra
          })

          console.log('UCharts: 图表创建成功')
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
