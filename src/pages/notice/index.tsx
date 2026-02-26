import { View, Text } from '@tarojs/components'
import { useLoad, showToast } from '@tarojs/taro'
import { useState } from 'react'
import './index.css'

const NoticePage = () => {
  const [noticeEnabled, setNoticeEnabled] = useState(false)
  const [adjustmentNoticeEnabled, setAdjustmentNoticeEnabled] = useState(false)
  const [priceChangeNoticeEnabled, setPriceChangeNoticeEnabled] = useState(false)

  // 切换总开关
  const handleToggleNotice = () => {
    const newValue = !noticeEnabled
    setNoticeEnabled(newValue)

    if (!newValue) {
      setAdjustmentNoticeEnabled(false)
      setPriceChangeNoticeEnabled(false)
    }

    showToast({
      title: newValue ? '已开启通知' : '已关闭通知',
      icon: 'success'
    })
  }

  // 切换调价通知
  const handleToggleAdjustmentNotice = () => {
    if (!noticeEnabled) {
      showToast({
        title: '请先开启总通知开关',
        icon: 'none'
      })
      return
    }
    setAdjustmentNoticeEnabled(!adjustmentNoticeEnabled)
    showToast({
      title: !adjustmentNoticeEnabled ? '已开启调价提醒' : '已关闭调价提醒',
      icon: 'success'
    })
  }

  // 切换价格变动通知
  const handleTogglePriceChangeNotice = () => {
    if (!noticeEnabled) {
      showToast({
        title: '请先开启总通知开关',
        icon: 'none'
      })
      return
    }
    setPriceChangeNoticeEnabled(!priceChangeNoticeEnabled)
    showToast({
      title: !priceChangeNoticeEnabled ? '已开启价格变动提醒' : '已关闭价格变动提醒',
      icon: 'success'
    })
  }

  useLoad(() => {
    console.log('通知设置页面加载')
  })

  return (
    <View className="w-full min-h-screen bg-gray-50">
      {/* 页面标题 */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <Text className="block text-lg font-bold text-gray-900">调价提醒</Text>
      </View>

      {/* 主要内容区域 */}
      <View className="p-4">
        {/* 总开关 */}
        <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <View className="flex flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="block text-base font-semibold text-gray-900 mb-1">
                开启通知
              </Text>
              <Text className="block text-xs text-gray-500">
                接收油价调价和价格变动提醒
              </Text>
            </View>
            <View
              className={`w-14 h-8 rounded-full flex items-center px-1 transition-colors ${noticeEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
              onClick={handleToggleNotice}
            >
              <View
                className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${noticeEnabled ? 'translate-x-6' : 'translate-x-0'}`}
              />
            </View>
          </View>
        </View>

        {/* 调价提醒 */}
        <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <View className="flex flex-row items-center justify-between">
            <View className="flex-1">
              <View className="flex flex-row items-center gap-2 mb-1">
                <Text className="text-lg">📅</Text>
                <Text className="block text-base font-semibold text-gray-900">
                  调价提醒
                </Text>
              </View>
              <Text className="block text-xs text-gray-500">
                调价当天推送通知
              </Text>
            </View>
            <View
              className={`w-14 h-8 rounded-full flex items-center px-1 transition-colors ${adjustmentNoticeEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
              onClick={handleToggleAdjustmentNotice}
            >
              <View
                className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${adjustmentNoticeEnabled ? 'translate-x-6' : 'translate-x-0'}`}
              />
            </View>
          </View>
        </View>

        {/* 价格变动提醒 */}
        <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <View className="flex flex-row items-center justify-between">
            <View className="flex-1">
              <View className="flex flex-row items-center gap-2 mb-1">
                <Text className="text-lg">💰</Text>
                <Text className="block text-base font-semibold text-gray-900">
                  价格变动提醒
                </Text>
              </View>
              <Text className="block text-xs text-gray-500">
                价格变动超过 0.1 元时提醒
              </Text>
            </View>
            <View
              className={`w-14 h-8 rounded-full flex items-center px-1 transition-colors ${priceChangeNoticeEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
              onClick={handleTogglePriceChangeNotice}
            >
              <View
                className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${priceChangeNoticeEnabled ? 'translate-x-6' : 'translate-x-0'}`}
              />
            </View>
          </View>
        </View>

        {/* 说明信息 */}
        <View className="bg-blue-50 rounded-xl p-4">
          <Text className="block text-sm font-semibold text-blue-600 mb-2">
            使用说明
          </Text>
          <Text className="block text-xs text-blue-600 leading-relaxed">
            1. 开启通知后，系统会在油价调价或价格变动时推送通知
            {'\n'}
            2. 请确保微信已开启通知权限
            {'\n'}
            3. 通知基于全国均价，具体价格以当地加油站为准
          </Text>
        </View>
      </View>
    </View>
  )
}

export default NoticePage
