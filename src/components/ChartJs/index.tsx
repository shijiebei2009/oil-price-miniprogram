import { View, Text } from '@tarojs/components'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

// 注册所有需要的组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface ChartJsProps {
  data: any[]
  config: any
  height?: number
}

const ChartJs: React.FC<ChartJsProps> = ({ data, config, height = 300 }) => {
  // 转换数据格式（从 F2 格式转换为 Chart.js 格式）
  const labels = data.map((item: any) => item.date)
  const datasets: any[] = []

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
        fill: false,
        pointRadius: 2,
        pointHoverRadius: 4
      } as any)
    })
  }

  const chartData = {
    labels,
    datasets
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: config.legend !== false,
        position: 'top' as const
      },
      tooltip: {
        mode: 'index' as const,
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

  if (!data || data.length === 0) {
    return (
      <View className="w-full flex items-center justify-center" style={{ height: `${height}px` }}>
        <Text className="block text-sm text-gray-500">暂无数据</Text>
      </View>
    )
  }

  return (
    <View
      className="w-full"
      style={{ height: `${height}px`, position: 'relative' }}
    >
      <Line data={chartData} options={options} />
    </View>
  )
}

export default ChartJs
