import Taro from '@tarojs/taro'
import { useEffect, useRef, useState } from 'react'
import { View, Text } from '@tarojs/components'
import * as echarts from 'echarts'
import './index.css'

interface PriceChartProps {
  data: Array<{
    date: string
    price92: number
    price95: number
    price98: number
    priceDiesel: number
  }>
  height?: number
}

const PriceChart: React.FC<PriceChartProps> = ({ data, height = 300 }) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const [chartInstance, setChartInstance] = useState<echarts.ECharts | null>(null)
  const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP

  // H5 端初始化 ECharts
  useEffect(() => {
    if (!isWeapp && chartRef.current && data.length > 0) {
      const chart = echarts.init(chartRef.current)
      setChartInstance(chart)

      const option = getChartOption(data)
      chart.setOption(option)

      const handleResize = () => {
        chart.resize()
      }

      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
        chart.dispose()
      }
    }
  }, [data, isWeapp])

  const getChartOption = (chartData: typeof data) => {
    const dates = chartData.map((item) => item.date)
    const prices92 = chartData.map((item) => item.price92)
    const prices95 = chartData.map((item) => item.price95)
    const prices98 = chartData.map((item) => item.price98)
    const pricesDiesel = chartData.map((item) => item.priceDiesel)

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: {
          color: '#374151'
        }
      },
      legend: {
        data: ['92#', '95#', '98#', '0#'],
        bottom: 0,
        itemGap: 20,
        textStyle: {
          color: '#6b7280',
          fontSize: 12
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
        axisLine: {
          lineStyle: {
            color: '#e5e7eb'
          }
        },
        axisLabel: {
          color: '#9ca3af',
          fontSize: 10
        }
      },
      yAxis: {
        type: 'value',
        min: (value: { min: number }) => Math.floor(value.min * 0.9),
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        splitLine: {
          lineStyle: {
            color: '#f3f4f6',
            type: 'dashed'
          }
        },
        axisLabel: {
          color: '#9ca3af',
          fontSize: 10
        }
      },
      series: [
        {
          name: '92#',
          type: 'line',
          data: prices92,
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: {
            color: '#3b82f6',
            width: 2
          },
          itemStyle: {
            color: '#3b82f6'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
              ]
            }
          }
        },
        {
          name: '95#',
          type: 'line',
          data: prices95,
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: {
            color: '#8b5cf6',
            width: 2
          },
          itemStyle: {
            color: '#8b5cf6'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(139, 92, 246, 0.3)' },
                { offset: 1, color: 'rgba(139, 92, 246, 0.05)' }
              ]
            }
          }
        },
        {
          name: '98#',
          type: 'line',
          data: prices98,
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: {
            color: '#ec4899',
            width: 2
          },
          itemStyle: {
            color: '#ec4899'
          }
        },
        {
          name: '0#',
          type: 'line',
          data: pricesDiesel,
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: {
            color: '#f59e0b',
            width: 2
          },
          itemStyle: {
            color: '#f59e0b'
          }
        }
      ]
    } as echarts.EChartsOption
  }

  if (isWeapp) {
    // 微信小程序端：显示提示信息
    return (
      <View className="price-chart">
        <View className="chart-toolbar">
          <Text className="block text-base font-semibold text-gray-900 mb-2">
            价格走势
          </Text>
        </View>

        {/* 图表区域 */}
        <View className="chart-container" style={{ height: `${height}px` }}>
          <View className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-xl">
            <Text className="block text-6xl mb-4">📊</Text>
            <Text className="block text-base font-semibold text-gray-700 mb-2">
              图表功能开发中
            </Text>
            <Text className="block text-sm text-gray-500 text-center px-8">
              微信小程序端图表功能正在开发中，请使用 H5 端体验完整功能
            </Text>
          </View>
        </View>

        {/* 提示信息 */}
        <Text className="block text-xs text-gray-400 text-center mt-2">
          数据已更新，可在下方列表查看详细价格
        </Text>
      </View>
    )
  }

  // H5 端：显示完整图表
  return (
    <View className="price-chart">
      {/* 工具栏 */}
      <View className="chart-toolbar">
        <Text className="block text-base font-semibold text-gray-900 mb-2">
          价格走势
        </Text>
      </View>

      {/* 图表区域 */}
      <View ref={chartRef} className="chart-container" style={{ height: `${height}px` }} />

      {/* 提示信息 */}
      <Text className="block text-xs text-gray-400 text-center mt-2">
        支持拖拽缩放查看不同时间段数据
      </Text>
    </View>
  )
}

export default PriceChart
