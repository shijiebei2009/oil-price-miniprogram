import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import { Network } from '@/network'
import './index.css'

interface ProvincePrice {
  name: string
  gas92: number
  gas95: number
  gas98: number
  diesel0: number
  diff: number
}

type OilType = 'gas92' | 'gas95' | 'gas98' | 'diesel0'

const RankPage = () => {
  const [loading, setLoading] = useState(true)
  const [provincePrices, setProvincePrices] = useState<ProvincePrice[]>([])
  const [selectedOilType, setSelectedOilType] = useState<OilType>('gas92')

  const oilTypeOptions = [
    { key: 'gas92' as OilType, label: '92#', color: '#f59e0b' },
    { key: 'gas95' as OilType, label: '95#', color: '#3b82f6' },
    { key: 'gas98' as OilType, label: '98#', color: '#8b5cf6' },
    { key: 'diesel0' as OilType, label: '柴油', color: '#10b981' },
  ]

  // 加载全国油价数据
  const loadProvincePrices = async () => {
    try {
      setLoading(true)
      const res = await Network.request({
        url: '/api/oil-price/provinces/compare',
        method: 'GET'
      })

      console.log('全国油价数据响应:', res.data)

      if (res.data?.code === 200 && res.data?.data) {
        setProvincePrices(res.data.data)
      }
    } catch (error) {
      console.error('获取全国油价数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProvincePrices()
  }, [])

  // 根据选择的油品类型排序
  const getSortedPrices = () => {
    return [...provincePrices].sort((a, b) => a[selectedOilType] - b[selectedOilType])
  }

  const sortedPrices = getSortedPrices()

  // 获取油品名称
  const getOilTypeName = (type: OilType) => {
    const map: Record<OilType, string> = {
      gas92: '92号汽油',
      gas95: '95号汽油',
      gas98: '98号汽油',
      diesel0: '0号柴油'
    }
    return map[type]
  }

  // 获取油品颜色
  const getOilTypeColor = (type: OilType) => {
    const map: Record<OilType, string> = {
      gas92: '#f59e0b',
      gas95: '#3b82f6',
      gas98: '#8b5cf6',
      diesel0: '#10b981'
    }
    return map[type]
  }

  return (
    <View className="rank-page">
      {/* 标题栏 */}
      <View className="rank-header">
        <Text className="rank-title">全国油价排名</Text>
      </View>

      {/* 油品选择器 */}
      <View className="oil-type-selector">
        {oilTypeOptions.map((option) => (
          <View
            key={option.key}
            className={`oil-type-option ${selectedOilType === option.key ? 'oil-type-active' : ''}`}
            style={{
              borderColor: selectedOilType === option.key ? option.color : '#e5e7eb'
            }}
            onClick={() => setSelectedOilType(option.key)}
          >
            <Text
              className="oil-type-text"
              style={{
                color: selectedOilType === option.key ? option.color : '#666'
              }}
            >
              {option.label}
            </Text>
          </View>
        ))}
      </View>

      {/* 排名列表 */}
      <ScrollView className="rank-list" scrollY>
        {loading ? (
          <View className="rank-loading">
            <Text className="rank-loading-text">加载中...</Text>
          </View>
        ) : sortedPrices.length === 0 ? (
          <View className="rank-empty">
            <Text className="rank-empty-text">暂无数据</Text>
          </View>
        ) : (
          sortedPrices.map((item, index) => (
            <View key={item.name} className="rank-item">
              <View className={`rank-index ${index < 3 ? 'rank-top-3' : ''}`}>
                <Text className="rank-index-text">{index + 1}</Text>
              </View>

              <View className="rank-info">
                <Text className="block rank-province-name">{item.name}</Text>
                <Text className="block rank-province-diff" style={{ color: item.diff >= 0 ? '#ef4444' : '#10b981' }}>
                  {item.diff >= 0 ? '+' : ''}{item.diff.toFixed(3)}元
                </Text>
              </View>

              <View className="rank-price">
                <Text
                  className="rank-price-value"
                  style={{ color: getOilTypeColor(selectedOilType) }}
                >
                  {item[selectedOilType].toFixed(2)}元
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* 底部说明 */}
      <View className="rank-footer">
        <Text className="block rank-footer-text">
          排名基于{getOilTypeName(selectedOilType)}价格，从低到高排序
        </Text>
        <Text className="block rank-footer-text">
          * 与全国均价差异，红色表示高于均价，绿色表示低于均价
        </Text>
      </View>
    </View>
  )
}

export default RankPage
