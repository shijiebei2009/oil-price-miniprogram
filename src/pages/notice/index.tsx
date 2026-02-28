import { View, Text } from '@tarojs/components'
import { useLoad, showToast, requestSubscribeMessage, login, getStorageSync, setStorageSync, getEnv, ENV_TYPE } from '@tarojs/taro'
import { useState } from 'react'
import { Network } from '@/network'
import './index.css'

const NoticePage = () => {
  const [noticeEnabled, setNoticeEnabled] = useState(false)
  const [adjustmentNoticeEnabled, setAdjustmentNoticeEnabled] = useState(false)
  const [priceChangeNoticeEnabled, setPriceChangeNoticeEnabled] = useState(false)
  const [openid, setOpenid] = useState<string>('')
  const [province, setProvince] = useState<string>('')
  const [city, setCity] = useState<string>('')

  // 检测当前环境
  const isWeapp = getEnv() === ENV_TYPE.WEAPP

  // 获取用户 openid（调用微信登录接口）
  const getOpenid = async () => {
    try {
      // 先从本地存储获取
      let cachedOpenid = getStorageSync('openid')
      if (cachedOpenid) {
        console.log('从缓存获取 openid:', cachedOpenid)
        setOpenid(cachedOpenid)
        return cachedOpenid
      }

      // 如果是小程序环境，尝试登录获取真实 openid
      if (isWeapp) {
        const loginRes = await login()
        console.log('登录成功，code:', loginRes.code)

        // 调用后端接口，用 code 换取真实的 openid
        const result = await Network.request({
          url: '/api/wechat/login',
          method: 'POST',
          data: { code: loginRes.code }
        })

        console.log('后端登录接口响应:', result.data)

        if (result.data.code === 200 && result.data.data) {
          const { openid: userOpenid } = result.data.data
          console.log('获取真实 openid 成功:', userOpenid)

          // 保存到本地存储
          setStorageSync('openid', userOpenid)
          setOpenid(userOpenid)

          return userOpenid
        } else {
          throw new Error(result.data.msg || '登录失败')
        }
      } else {
        // H5 环境，使用降级方案（固定的测试 openid）
        console.log('H5 环境，使用测试 openid')
        const mockOpenid = 'mock_test_user_12345'
        setStorageSync('openid', mockOpenid)
        setOpenid(mockOpenid)
        return mockOpenid
      }
    } catch (error) {
      console.error('获取 openid 失败:', error)

      // 如果登录失败，使用降级方案
      console.log('登录失败，使用降级 openid')
      const mockOpenid = 'mock_test_user_12345'
      setStorageSync('openid', mockOpenid)
      setOpenid(mockOpenid)

      return mockOpenid
    }
  }

  // 查询用户的订阅状态
  const loadUserSubscriptions = async () => {
    try {
      const currentOpenid = await getOpenid()
      if (!currentOpenid) {
        return
      }

      const result = await Network.request({
        url: '/api/subscription-message',
        data: { openid: currentOpenid }
      })

      console.log('查询订阅结果:', result.data)

      if (result.data.code === 200 && result.data.data) {
        const subscriptions = result.data.data

        // 检查是否有调价提醒订阅
        const priceChangeSub = subscriptions.find((sub: any) => sub.scene === 'price_change')
        if (priceChangeSub) {
          setAdjustmentNoticeEnabled(true)
          setNoticeEnabled(true)
        }

        // 检查是否有价格变动提醒订阅
        const priceAlertSub = subscriptions.find((sub: any) => sub.scene === 'price_alert')
        if (priceAlertSub) {
          setPriceChangeNoticeEnabled(true)
          setNoticeEnabled(true)
        }
      }
    } catch (error) {
      console.error('查询订阅状态失败:', error)
    }
  }

  // 保存订阅记录到后端
  const saveSubscription = async (scene: string) => {
    try {
      const currentOpenid = openid || await getOpenid()
      if (!currentOpenid) {
        return false
      }

      // 微信订阅消息模板ID
      const templateId = '5EF4BLK0L6HShqcnRiqBq1SKlWp4ZiqP5L1TmidV_QA'

      const result = await Network.request({
        url: '/api/subscription-message',
        method: 'POST',
        data: {
          openid: currentOpenid,
          templateId,
          scene,
          province,
          city,
        }
      })

      console.log('保存订阅结果:', result.data)

      if (result.data.code === 200) {
        return true
      } else {
        showToast({
          title: result.data.msg || '订阅失败',
          icon: 'none'
        })
        return false
      }
    } catch (error) {
      console.error('保存订阅失败:', error)
      showToast({
        title: '订阅失败，请重试',
        icon: 'none'
      })
      return false
    }
  }

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
  const handleToggleAdjustmentNotice = async () => {
    if (!noticeEnabled) {
      showToast({
        title: '请先开启总通知开关',
        icon: 'none'
      })
      return
    }

    // 如果关闭，直接更新状态
    if (adjustmentNoticeEnabled) {
      setAdjustmentNoticeEnabled(false)
      showToast({
        title: '已关闭调价提醒',
        icon: 'success'
      })
      return
    }

    // 如果开启，需要请求订阅权限（仅小程序环境）
    try {
      // 微信订阅消息模板ID
      const templateId = '5EF4BLK0L6HShqcnRiqBq1SKlWp4ZiqP5L1TmidV_QA'

      let success = false

      if (isWeapp) {
        // 小程序环境，请求订阅权限
        const subscribeRes = await requestSubscribeMessage({
          tmplIds: [templateId]
        } as any)

        console.log('订阅权限结果:', subscribeRes)

        // 检查是否授权成功
        if (subscribeRes[templateId] === 'accept') {
          success = await saveSubscription('price_change')
        } else if (subscribeRes[templateId] === 'reject') {
          showToast({
            title: '您已拒绝订阅授权',
            icon: 'none'
          })
          return
        } else if (subscribeRes[templateId] === 'ban') {
          showToast({
            title: '您已永久拒绝订阅，请在微信设置中开启',
            icon: 'none'
          })
          return
        }
      } else {
        // H5 环境，直接保存订阅（降级方案）
        console.log('H5 环境，直接保存订阅记录')
        success = await saveSubscription('price_change')
      }

      if (success) {
        setAdjustmentNoticeEnabled(true)
        showToast({
          title: '已开启调价提醒',
          icon: 'success'
        })
      }
    } catch (error) {
      console.error('请求订阅权限失败:', error)
      showToast({
        title: '请求订阅失败，请重试',
        icon: 'none'
      })
    }
  }

  // 切换价格变动提醒
  const handleTogglePriceChangeNotice = async () => {
    if (!noticeEnabled) {
      showToast({
        title: '请先开启总通知开关',
        icon: 'none'
      })
      return
    }

    // 如果关闭，直接更新状态
    if (priceChangeNoticeEnabled) {
      setPriceChangeNoticeEnabled(false)
      showToast({
        title: '已关闭价格变动提醒',
        icon: 'success'
      })
      return
    }

    // 如果开启，需要请求订阅权限（仅小程序环境）
    try {
      // 微信订阅消息模板ID
      const templateId = '5EF4BLK0L6HShqcnRiqBq1SKlWp4ZiqP5L1TmidV_QA'

      let success = false

      if (isWeapp) {
        // 小程序环境，请求订阅权限
        const subscribeRes = await requestSubscribeMessage({
          tmplIds: [templateId]
        } as any)

        console.log('订阅权限结果:', subscribeRes)

        // 检查是否授权成功
        if (subscribeRes[templateId] === 'accept') {
          success = await saveSubscription('price_alert')
        } else if (subscribeRes[templateId] === 'reject') {
          showToast({
            title: '您已拒绝订阅授权',
            icon: 'none'
          })
          return
        } else if (subscribeRes[templateId] === 'ban') {
          showToast({
            title: '您已永久拒绝订阅，请在微信设置中开启',
            icon: 'none'
          })
          return
        }
      } else {
        // H5 环境，直接保存订阅（降级方案）
        console.log('H5 环境，直接保存订阅记录')
        success = await saveSubscription('price_alert')
      }

      if (success) {
        setPriceChangeNoticeEnabled(true)
        showToast({
          title: '已开启价格变动提醒',
          icon: 'success'
        })
      }
    } catch (error) {
      console.error('请求订阅权限失败:', error)
      showToast({
        title: '请求订阅失败，请重试',
        icon: 'none'
      })
    }
  }

  useLoad(() => {
    console.log('通知设置页面加载')

    // TODO: 从本地存储或后端获取用户的城市信息
    setProvince('北京市')
    setCity('北京')

    // 查询用户的订阅状态
    loadUserSubscriptions()
  })

  return (
    <View className="w-full min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
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
        <View className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
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
