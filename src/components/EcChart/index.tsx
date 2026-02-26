import { View } from '@tarojs/components'
import { useRef } from 'react'
import './index.css'

// 引入 ec-canvas 组件
import './ec-canvas/index'

interface EcChartProps {
  ec: {
    onInit: (canvas: any, width: number, height: number) => void
    onTouchStart?: (e: any) => void
    onTouchMove?: (e: any) => void
    onTouchEnd?: (e: any) => void
    disableTouch?: boolean
    canvas?: any
    width?: number
    height?: number
  }
  height?: number
}

const EcChart: React.FC<EcChartProps> = ({ ec, height = 300 }) => {
  const canvasId = useRef(`ec-canvas-${Date.now()}`)

  return (
    <View className="ec-chart" style={{ height: `${height}px` }}>
      {/* @ts-ignore */}
      <ec-canvas
        id={canvasId.current}
        canvasId={canvasId.current}
        ec={ec}
      />
    </View>
  )
}

export default EcChart
