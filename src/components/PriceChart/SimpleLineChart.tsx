import { View, Canvas } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useRef } from 'react'

interface SimpleLineChartProps {
  data: Array<{
    date: string
    gas92: number
    gas95: number
    gas98: number
    diesel0: number
  }>
  height: number
  selectedOil?: 'gas92' | 'gas95' | 'gas98' | 'diesel0'
}

const SimpleLineChart: React.FC<SimpleLineChartProps> = ({ data, height, selectedOil = 'gas92' }) => {
  const canvasRef = useRef<any>(null)

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return

    const query = Taro.createSelectorQuery()
    query.select('#simple-chart')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0]) return

        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = Taro.getSystemInfoSync().pixelRatio

        // 设置 canvas 尺寸
        canvas.width = res[0].width * dpr
        canvas.height = res[0].height * dpr
        ctx.scale(dpr, dpr)

        // 绘制图表
        drawChart(ctx, res[0].width, res[0].height, data, selectedOil)
      })
  }, [data, selectedOil])

  return (
    <View style={{ width: '100%', height }}>
      <Canvas
        id="simple-chart"
        type="2d"
        style={{ width: '100%', height }}
        ref={canvasRef}
      />
    </View>
  )
}

interface DataPoint {
  date: string
  [key: string]: string | number
}

function drawChart(
  ctx: any,
  width: number,
  height: number,
  data: DataPoint[],
  selectedOil: string
) {
  if (data.length === 0) return

  const padding = { top: 20, right: 20, bottom: 40, left: 50 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // 获取数据范围
  const values = data.map(d => Number(d[selectedOil]))
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const valueRange = maxValue - minValue || 1

  // 绘制坐标轴
  ctx.beginPath()
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 1
  ctx.moveTo(padding.left, padding.top)
  ctx.lineTo(padding.left, height - padding.bottom)
  ctx.lineTo(width - padding.right, height - padding.bottom)
  ctx.stroke()

  // 绘制 Y 轴标签
  ctx.fillStyle = '#6b7280'
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'right'
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartHeight / 4) * i
    const value = maxValue - (valueRange / 4) * i
    ctx.fillText(value.toFixed(2), padding.left - 5, y + 4)

    // 绘制水平网格线
    ctx.beginPath()
    ctx.strokeStyle = '#f3f4f6'
    ctx.moveTo(padding.left, y)
    ctx.lineTo(width - padding.right, y)
    ctx.stroke()
  }

  // 绘制数据线
  ctx.beginPath()
  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = 2

  data.forEach((d, i) => {
    const x = padding.left + (chartWidth / (data.length - 1)) * i
    const y = padding.top + chartHeight - ((Number(d[selectedOil]) - minValue) / valueRange) * chartHeight

    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })

  ctx.stroke()

  // 绘制数据点
  ctx.fillStyle = '#3b82f6'
  data.forEach((d, i) => {
    const x = padding.left + (chartWidth / (data.length - 1)) * i
    const y = padding.top + chartHeight - ((Number(d[selectedOil]) - minValue) / valueRange) * chartHeight

    ctx.beginPath()
    ctx.arc(x, y, 3, 0, 2 * Math.PI)
    ctx.fill()
  })

  // 绘制 X 轴标签
  ctx.fillStyle = '#6b7280'
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'center'
  const xLabelCount = Math.min(data.length, 6)
  const xLabelStep = Math.ceil(data.length / xLabelCount)

  for (let i = 0; i < data.length; i += xLabelStep) {
    const x = padding.left + (chartWidth / (data.length - 1)) * i
    const date = new Date(String(data[i].date))
    const label = `${date.getMonth() + 1}/${date.getDate()}`
    ctx.fillText(label, x, height - padding.bottom + 15)
  }
}

export default SimpleLineChart
