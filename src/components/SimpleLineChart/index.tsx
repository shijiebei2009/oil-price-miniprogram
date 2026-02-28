import { View, Canvas } from '@tarojs/components'
import { useEffect, useRef, useState } from 'react'
import Taro from '@tarojs/taro'

interface SimpleLineChartProps {
  data: Array<{
    date: string
    gas92: number
    gas95: number
    gas98: number
    diesel0: number
  }>
  height?: number
}

const SimpleLineChart: React.FC<SimpleLineChartProps> = ({ data, height = 400 }) => {
  const [canvasId] = useState(`chart-${Date.now()}-${Math.floor(Math.random() * 10000)}`)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!data || data.length === 0) {
      return
    }

    const initChart = () => {
      const query = Taro.createSelectorQuery()
      query.select(`#${canvasId}`)
        .fields({ node: true, size: true })
        .exec((res: any) => {
          if (res && res[0]) {
            const { node: canvas, width, height } = res[0]
            canvasRef.current = canvas

            const dpr = Taro.getSystemInfoSync().pixelRatio || 1
            canvas.width = width * dpr
            canvas.height = height * dpr

            const ctx = canvas.getContext('2d')
            ctx.scale(dpr, dpr)

            drawChart(ctx, width, height)
          }
        })
    }

    setTimeout(initChart, 500)
  }, [data, canvasId, height])

  const drawChart = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!data || data.length === 0) return

    const padding = { top: 20, right: 20, bottom: 40, left: 50 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    // 计算数据范围
    const allPrices = data.flatMap(item => [item.gas92, item.gas95, item.gas98, item.diesel0])
    const minPrice = Math.min(...allPrices)
    const maxPrice = Math.max(...allPrices)
    const priceRange = maxPrice - minPrice || 1

    // 配置
    const series = [
      { key: 'gas92', color: '#1890ff', name: '92#汽油' },
      { key: 'gas95', color: '#52c41a', name: '95#汽油' },
      { key: 'gas98', color: '#faad14', name: '98#汽油' },
      { key: 'diesel0', color: '#8c8c8c', name: '0#柴油' }
    ]

    // 绘制 Y 轴
    ctx.beginPath()
    ctx.strokeStyle = '#e5e5e5'
    ctx.lineWidth = 1
    const ySteps = 5
    for (let i = 0; i <= ySteps; i++) {
      const y = padding.top + (chartHeight / ySteps) * i
      const value = maxPrice - (priceRange / ySteps) * i

      ctx.moveTo(padding.left, y)
      ctx.lineTo(width - padding.right, y)

      // Y 轴标签
      ctx.fillStyle = '#666'
      ctx.font = '12px Arial'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      ctx.fillText(value.toFixed(2), padding.left - 8, y)
    }
    ctx.stroke()

    // 绘制折线
    series.forEach(s => {
      const points = data.map((item, index) => {
        const x = padding.left + (chartWidth / (data.length - 1)) * index
        const y = padding.top + chartHeight - ((item[s.key] - minPrice) / priceRange) * chartHeight
        return { x, y, value: item[s.key] }
      })

      // 绘制线
      ctx.beginPath()
      ctx.strokeStyle = s.color
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y)
        } else {
          ctx.lineTo(point.x, point.y)
        }
      })
      ctx.stroke()

      // 绘制点
      points.forEach(point => {
        ctx.beginPath()
        ctx.fillStyle = s.color
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2)
        ctx.fill()

        ctx.beginPath()
        ctx.fillStyle = '#fff'
        ctx.arc(point.x, point.y, 2, 0, Math.PI * 2)
        ctx.fill()
      })
    })

    // 绘制 X 轴标签
    ctx.fillStyle = '#666'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'

    data.forEach((item, index) => {
      const x = padding.left + (chartWidth / (data.length - 1)) * index
      const label = item.date.substring(5) // 只显示月-日
      ctx.fillText(label, x, height - padding.bottom + 10)
    })

    console.log('SimpleLineChart: 图表绘制完成')
  }

  return (
    <View id="chart-container" style={{ width: '100%', height: `${height}px` }}>
      <Canvas
        id={canvasId}
        type="2d"
        canvasId={canvasId}
        style={{ width: '100%', height: '100%' }}
      />
    </View>
  )
}

export default SimpleLineChart
