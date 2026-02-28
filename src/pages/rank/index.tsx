import { View, Text, ScrollView, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
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
  const [selectedProvince, setSelectedProvince] = useState<ProvincePrice | null>(null)
  const [showPicker, setShowPicker] = useState(false)

  const oilTypeOptions = [
    { key: 'gas92' as OilType, label: '92#', color: '#666' },
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
        // 默认选择排名第一的省份
        if (res.data.data.length > 0) {
          setSelectedProvince(res.data.data[0])
        }
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
      gas92: '#666',
      gas95: '#3b82f6',
      gas98: '#8b5cf6',
      diesel0: '#10b981'
    }
    return map[type]
  }

  // 获取当前省份的排名
  const getCurrentRank = () => {
    if (!selectedProvince) return '-'
    return sortedPrices.findIndex(p => p.name === selectedProvince.name) + 1
  }

  // 分享功能
  const handleShare = () => {
    const shareText = `【全国油价排名】\n\n` +
      `${selectedProvince?.name}${getOilTypeName(selectedOilType)}排名：第${getCurrentRank()}名\n` +
      `价格：${selectedProvince?.[selectedOilType].toFixed(2)}元\n` +
      `与全国均价差异：${selectedProvince?.diff >= 0 ? '+' : ''}${selectedProvince?.diff.toFixed(3)}元\n\n` +
      `来自油价查询小程序`

    // H5 端复制到剪贴板
    if (Taro.getEnv() === Taro.ENV_TYPE.WEB) {
      navigator.clipboard.writeText(shareText).then(() => {
        alert('分享内容已复制到剪贴板')
      })
    } else {
      // 小程序端调用分享
      Taro.shareAppMessage({
        title: `${selectedProvince?.name}${getOilTypeName(selectedOilType)}排名第${getCurrentRank()}`,
        path: '/pages/rank/index',
        imageUrl: ''
      })
    }
  }

  // 选择省份
  const handleSelectProvince = (province: ProvincePrice) => {
    setSelectedProvince(province)
    setShowPicker(false)
  }

  return (
    <View className="rank-page">
      {/* 顶部标题栏 */}
      <View className="rank-header">
        <Text className="rank-title">全国油价排名</Text>
        <Button className="share-button" onClick={handleShare}>
          <Text className="share-icon">📤</Text>
          <Text className="share-text">分享</Text>
        </Button>
      </View>

      {/* 当前选中省份展示 */}
      {!loading && selectedProvince && (
        <View className="current-province-card">
          <View className="province-info-header">
            <View className="province-rank-badge">
              <Text className="rank-badge-text">TOP {getCurrentRank()}</Text>
            </View>
            <Text className="province-name">{selectedProvince.name}</Text>
          </View>

          <View className="province-prices">
            {oilTypeOptions.map((option) => (
              <View
                key={option.key}
                className={`price-item ${selectedOilType === option.key ? 'price-item-active' : ''}`}
                style={{
                  borderColor: selectedOilType === option.key ? option.color : '#e5e7eb'
                }}
              >
                <Text
                  className="price-label"
                  style={{ color: selectedOilType === option.key ? option.color : '#666' }}
                >
                  {option.label}
                </Text>
                <Text
                  className="price-value"
                  style={{ color: selectedOilType === option.key ? option.color : '#333' }}
                >
                  {selectedProvince[option.key].toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          <View className="province-diff">
            <Text className="diff-text">
              与全国均价差异：
              <Text style={{ color: selectedProvince.diff >= 0 ? '#ef4444' : '#10b981' }}>
                {selectedProvince.diff >= 0 ? '+' : ''}{selectedProvince.diff.toFixed(3)}元
              </Text>
            </Text>
          </View>

          <Button className="open-picker-button" onClick={() => setShowPicker(true)}>
            <Text className="open-picker-text">切换省份</Text>
          </Button>
        </View>
      )}

      {/* 省份选择器弹窗 */}
      {showPicker && (
        <View className="rank-picker-overlay" onClick={() => setShowPicker(false)}>
          <View className="rank-picker-content" onClick={(e) => e.stopPropagation()}>
            {/* 标题栏 */}
            <View className="picker-header">
              <Text className="picker-title">选择省份</Text>
              <Text className="picker-close" onClick={() => setShowPicker(false)}>✕</Text>
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
            <ScrollView className="picker-list" scrollY>
              {sortedPrices.map((item, index) => (
                <View
                  key={item.name}
                  className={`picker-item ${selectedProvince?.name === item.name ? 'picker-item-active' : ''}`}
                  onClick={() => handleSelectProvince(item)}
                >
                  <View className={`picker-index ${index < 3 ? 'picker-top-3' : ''}`}>
                    <Text className="picker-index-text">{index + 1}</Text>
                  </View>

                  <View className="picker-info">
                    <Text className="block picker-province-name">{item.name}</Text>
                    <Text
                      className="block picker-province-diff"
                      style={{ color: item.diff >= 0 ? '#ef4444' : '#10b981' }}
                    >
                      {item.diff >= 0 ? '+' : ''}{item.diff.toFixed(3)}元
                    </Text>
                  </View>

                  <View className="picker-price">
                    <Text
                      className="picker-price-value"
                      style={{ color: getOilTypeColor(selectedOilType) }}
                    >
                      {item[selectedOilType].toFixed(2)}元
                    </Text>
                  </View>

                  {selectedProvince?.name === item.name && (
                    <View className="picker-check">
                      <Text className="check-icon">✓</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* 加载状态 */}
      {loading && (
        <View className="rank-loading">
          <Text className="rank-loading-text">加载中...</Text>
        </View>
      )}
    </View>
  )
}

export default RankPage
