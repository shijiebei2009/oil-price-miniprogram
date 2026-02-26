import { View, Text, ScrollView, Input } from '@tarojs/components'
import { useState, useEffect } from 'react'
import './index.css'

interface CityItem {
  name: string
  province: string
  gas92: number
  gas95: number
  gas98: number
  diesel0: number
}

interface CityPickerProps {
  visible: boolean
  currentCity: string
  cities: CityItem[]
  onSelect: (city: string) => void
  onClose: () => void
}

const CityPicker: React.FC<CityPickerProps> = ({
  visible,
  currentCity,
  cities,
  onSelect,
  onClose
}) => {
  const [searchText, setSearchText] = useState('')
  const [filteredCities, setFilteredCities] = useState<CityItem[]>(cities)

  useEffect(() => {
    if (visible) {
      setSearchText('')
      setFilteredCities(cities)
    }
  }, [visible, cities])

  // 搜索城市
  useEffect(() => {
    if (!searchText) {
      setFilteredCities(cities)
      return
    }

    const filtered = cities.filter(city =>
      city.name.includes(searchText) ||
      city.province.includes(searchText)
    )
    setFilteredCities(filtered)
  }, [searchText, cities])

  // 按省份分组
  const groupedCities = filteredCities.reduce((acc, city) => {
    if (!acc[city.province]) {
      acc[city.province] = []
    }
    acc[city.province].push(city)
    return acc
  }, {} as Record<string, CityItem[]>)

  // 处理城市选择
  const handleCitySelect = (cityName: string) => {
    onSelect(cityName)
    onClose()
  }

  if (!visible) {
    return null
  }

  return (
    <View className="city-picker-overlay" onClick={onClose}>
      <View className="city-picker-content" onClick={(e) => e.stopPropagation()}>
        {/* 标题栏 */}
        <View className="city-picker-header">
          <Text className="city-picker-title">选择城市</Text>
          <Text className="city-picker-close" onClick={onClose}>✕</Text>
        </View>

        {/* 搜索框 */}
        <View className="city-search-box">
          <View className="city-search-input-wrapper">
            <Input
              className="city-search-input"
              placeholder="搜索城市"
              placeholderClass="city-search-placeholder"
              value={searchText}
              onInput={(e) => setSearchText(e.detail.value)}
            />
          </View>
        </View>

        {/* 城市列表 */}
        <ScrollView className="city-list" scrollY>
          {Object.keys(groupedCities).map(province => (
            <View key={province} className="city-group">
              <View className="city-group-header">
                <Text className="city-group-title">{province}</Text>
              </View>

              {groupedCities[province].map(city => (
                <View
                  key={city.name}
                  className={`city-item ${currentCity === city.name ? 'city-item-active' : ''}`}
                  onClick={() => handleCitySelect(city.name)}
                >
                  <View className="city-item-left">
                    <Text className="block city-name">{city.name}</Text>
                    <Text className="block city-price">92#: {city.gas92.toFixed(2)}元</Text>
                  </View>
                  {currentCity === city.name && (
                    <View className="city-item-check">
                      <Text className="check-icon">✓</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ))}

          {filteredCities.length === 0 && (
            <View className="city-empty">
              <Text className="city-empty-text">未找到相关城市</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  )
}

export default CityPicker
