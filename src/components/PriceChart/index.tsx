import Taro from '@tarojs/taro'
import { useEffect, useRef, useState } from 'react'
import { View, Text } from '@tarojs/components'
import * as echarts from 'echarts'
import WxChart from '@/components/WxChart'
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
  const [isExporting, setIsExporting] = useState(false)
  const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP

  useEffect(() => {
    if (!isWeapp && chartRef.current && data.length > 0) {
      // H5 端初始化 ECharts
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // 数据缩放组件
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100
        },
        {
          type: 'slider',
          start: 0,
          end: 100,
          height: 20,
          bottom: 50
        }
      ],
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

  // 导出图表为图片
  const handleExport = async () => {
    if (isExporting) return

    try {
      setIsExporting(true)

      if (isWeapp) {
        // 小程序端：通过 ec-canvas 导出
        Taro.showLoading({
          title: '导出中...',
          mask: true
        })

        // 小程序端需要保存到相册
        // 注意：需要用户授权相册权限
        try {
          // 1. 检查相册授权
          const authResult = await Taro.getSetting() as any

          if (!authResult.authSetting['scope.writePhotosAlbum']) {
            // 2. 请求授权
            const authorizeResult = await Taro.authorize({
              scope: 'scope.writePhotosAlbum'
            }) as any
            if (!authorizeResult.authSetting['scope.writePhotosAlbum']) {
              throw new Error('需要相册权限才能保存图片')
            }
          }

          // 3. 获取 canvas 实例并导出
          // 由于 ec-canvas 的 canvasToTempFilePath 方法需要组件实例，这里需要通过 ref 获取
          // 目前 ec-canvas 组件未暴露 ref，需要先提示用户使用截图功能
          Taro.hideLoading()
          Taro.showModal({
            title: '导出提示',
            content: '小程序端导出功能正在开发中，您可以截图保存。H5 端支持直接导出图片到本地。',
            showCancel: false
          })
        } catch (error: any) {
          Taro.hideLoading()
          if (error.errMsg && error.errMsg.includes('auth deny')) {
            Taro.showModal({
              title: '权限说明',
              content: '需要相册权限才能保存图片，请前往设置开启权限',
              confirmText: '去设置',
              success: (res) => {
                if (res.confirm) {
                  Taro.openSetting()
                }
              }
            })
          } else {
            Taro.showToast({
              title: error.message || '导出失败',
              icon: 'none'
            })
          }
        }
      } else if (chartInstance) {
        // H5 端：通过 ECharts 的 getDataURL 方法导出
        const url = chartInstance.getDataURL({
          type: 'png',
          pixelRatio: 2,
          backgroundColor: '#fff'
        })

        // 创建下载链接
        const link = document.createElement('a')
        const filename = `油价走势图_${new Date().getTime()}.png`
        link.download = filename
        link.href = url
        link.click()

        Taro.showModal({
          title: '导出成功',
          content: `图片已保存到浏览器的默认下载文件夹\n文件名: ${filename}`,
          showCancel: false
        })
      }
    } catch (error) {
      console.error('导出失败:', error)
      Taro.showToast({
        title: '导出失败',
        icon: 'none'
      })
    } finally {
      setIsExporting(false)
    }
  }

  if (data.length === 0) {
    return (
      <View className="price-chart">
        <View className="chart-placeholder">
          <Text className="block text-gray-500 text-center">
            暂无数据
          </Text>
        </View>
      </View>
    )
  }

  const chartOption = getChartOption(data)

  return (
    <View className="price-chart">
      {/* 工具栏 */}
      <View className="chart-toolbar">
        <Text className="block text-base font-semibold text-gray-900 mb-2">
          价格走势
        </Text>
        <View
          className={`export-button ${isExporting ? 'export-button-disabled' : ''}`}
          onClick={() => !isExporting && handleExport()}
        >
          <Text className="export-icon">📥</Text>
          <Text className="export-text">{isExporting ? '导出中...' : '导出图片'}</Text>
        </View>
      </View>

      {/* 图表区域 */}
      {isWeapp ? (
        // 小程序端使用 WxChart 组件
        <View style={{ width: '100%', height: `${height}px` }}>
          <WxChart
            option={chartOption}
            height={height}
          />
        </View>
      ) : (
        // H5 端使用原生 ECharts
        <View ref={chartRef} style={{ width: '100%', height: `${height}px` }} />
      )}

      {/* 提示信息 */}
      <Text className="block text-xs text-gray-400 text-center mt-2">
        支持拖拽缩放查看不同时间段数据 · H5 端支持导出图片
      </Text>
    </View>
  )
}

export default PriceChart
