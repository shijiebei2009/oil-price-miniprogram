import { View, Text } from '@tarojs/components'
import { useState } from 'react'
import './index.css'

interface CityItem {
  name: string
  region: string
  level: number
  gas92: number
  gas95: number
  gas98: number
  diesel0: number
}

interface CityPickerProps {
  visible: boolean
  cityList: CityItem[]
  currentCity: string
  onSelect: (cityName: string) => void
  onClose: () => void
}

const CityPicker = ({ visible, cityList, currentCity, onSelect, onClose }: CityPickerProps) => {
  const [selectedCity, setSelectedCity] = useState(currentCity)

  if (!visible) return null

  const regions = ['华东', '华南', '华北', '华中', '西北', '西南', '东北']

  const handleCityClick = (cityName: string) => {
    setSelectedCity(cityName)
    console.log('选择城市:', cityName)
  }

  const handleConfirm = () => {
    console.log('确认选择城市:', selectedCity)
    onSelect(selectedCity)
    onClose()
  }

  return (
    <View className="city-picker-overlay" onClick={onClose}>
      <View className="city-picker-container" onClick={(e) => e.stopPropagation()}>
        <View className="city-picker-header">
          <Text className="city-picker-title">选择城市</Text>
          <Text className="city-picker-close" onClick={onClose}>✕</Text>
        </View>

        <View className="city-picker-content">
          {regions.map((region) => {
            const regionCities = cityList.filter(city => city.region === region)
            if (regionCities.length === 0) return null

            return (
              <View key={region} className="city-region">
                <Text className="city-region-title">{region}</Text>
                <View className="city-grid">
                  {regionCities.map((city) => (
                    <View
                      key={city.name}
                      className={`city-item ${selectedCity === city.name ? 'city-item-selected' : ''}`}
                      onClick={() => handleCityClick(city.name)}
                    >
                      <Text className="city-name">{city.name.replace(/[省市]/g, '')}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )
          })}
        </View>

        <View className="city-picker-footer">
          <View className="city-picker-cancel" onClick={onClose}>
            <Text className="city-picker-cancel-text">取消</Text>
          </View>
          <View className="city-picker-confirm" onClick={handleConfirm}>
            <Text className="city-picker-confirm-text">确定</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

export default CityPicker
