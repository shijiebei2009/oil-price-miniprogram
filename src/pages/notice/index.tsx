import { View, Text } from '@tarojs/components'
import { useLoad, showToast, requestSubscribeMessage, login, getStorageSync, setStorageSync, getEnv, ENV_TYPE, getLocation } from '@tarojs/taro'
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
  const [lastSubscribedAt, setLastSubscribedAt] = useState<string>('') // 🔧 最后订阅时间

  // 检测当前环境
  const isWeapp = getEnv() === ENV_TYPE.WEAPP

  // 获取微信订阅消息模板ID
  const getTemplateId = () => {
    // 小程序环境从环境变量读取
    // 注意：TARO_APP_WECHAT_SUBSCRIBE_TEMPLATE_ID 已在 config/index.ts 中通过 defineConstants 注入
    if (isWeapp && TARO_APP_WECHAT_SUBSCRIBE_TEMPLATE_ID) {
      return TARO_APP_WECHAT_SUBSCRIBE_TEMPLATE_ID
    }

    // H5环境或环境变量未配置时，使用测试模板（降级方案）
    return '5EF4BLK0L6HShqcnRiqBq1SKlWp4ZiqP5L1TmidV_QA'
  }

  // 获取用户 openid（调用微信登录接口）
  const getOpenid = async () => {
    try {
      // 先从本地存储获取
      let cachedOpenid = getStorageSync('openid')

      // 在小程序环境中，如果缓存的 openid 是 mock 的，清空缓存并重新登录
      if (isWeapp && cachedOpenid && cachedOpenid.startsWith('mock_')) {
        console.log('小程序环境检测到 mock openid，清空缓存并重新登录')
        setStorageSync('openid', '')
        cachedOpenid = ''
      }

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

        // 🔧 保存最后订阅时间
        if (subscriptions && subscriptions.length > 0) {
          const latestSubscription = subscriptions[0] // 已按创建时间降序排列
          const createdAt = new Date(latestSubscription.created_at)
          const now = new Date()
          const diffHours = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60))

          if (diffHours < 24) {
            setLastSubscribedAt(`最近订阅：${diffHours === 0 ? '刚刚' : diffHours + '小时前'}`)
          } else if (diffHours < 48) {
            setLastSubscribedAt(`最近订阅：昨天`)
          } else {
            setLastSubscribedAt(`最近订阅：${createdAt.toLocaleDateString('zh-CN')}`)
          }
        }

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

      // 微信订阅消息模板ID（从环境变量读取）
      const templateId = getTemplateId()

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
      // 微信订阅消息模板ID（从环境变量读取）
      const templateId = getTemplateId()

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
      // 微信订阅消息模板ID（从环境变量读取）
      const templateId = getTemplateId()

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

  // 获取用户城市信息
  const getUserCity = async () => {
    try {
      // 先从本地存储获取
      const cachedCity = getStorageSync('userCity')
      if (cachedCity) {
        console.log('从缓存获取城市:', cachedCity)
        setCity(cachedCity)
        setProvince(getProvinceName(cachedCity))
        return
      }

      // 如果没有缓存，调用位置服务获取当前城市
      console.log('缓存中没有城市信息，调用位置服务获取')
      const location = await getLocation({ type: isWeapp ? 'gcj02' : 'wgs04' })

      // 检查是否是云开发环境
      const isCloudEnv = typeof wx !== 'undefined' && wx.cloud

      if (isCloudEnv) {
        // 云开发环境：使用坐标推断省份
        console.log('云开发环境，使用坐标推断城市')
        const province = getProvinceByCoordinate(location.latitude, location.longitude)
        if (province) {
          setProvince(province)
          setCity(province.replace('省', '').replace('市', '').replace('自治区', '').replace('壮族', '').replace('维吾尔', '').replace('回族', ''))
          setStorageSync('userCity', province)
          showToast({
            title: `已定位到${province}`,
            icon: 'success',
            duration: 1500
          })
        } else {
          // 降级方案：使用默认城市
          setProvince('上海市')
          setCity('上海')
        }
        return
      }

      // 非云开发环境：调用后端逆地理编码接口
      const res = await Network.request({
        url: `/api/location/reverse-geocode?lat=${location.latitude}&lng=${location.longitude}`,
        method: 'GET'
      })

      if (res.data?.code === 200 && res.data?.data) {
        const cityName = res.data.data.city
        const provinceName = res.data.data.province

        console.log('获取到城市信息:', cityName, provinceName)

        // 保存到本地存储
        setStorageSync('userCity', cityName)
        setCity(cityName)
        setProvince(provinceName)

        showToast({
          title: `已定位到${cityName}`,
          icon: 'success',
          duration: 1500
        })
      }
    } catch (error) {
      console.error('获取城市信息失败:', error)

      // 降级方案：使用默认城市
      setProvince('上海市')
      setCity('上海')
    }
  }

  // 根据城市名称获取省份名称
  const getProvinceName = (cityName: string): string => {
    // 简单的映射表，实际应该从数据中获取
    const cityProvinceMap: Record<string, string> = {
      '北京': '北京市',
      '上海': '上海市',
      '天津': '天津市',
      '重庆': '重庆市',
      '广州': '广东省',
      '深圳': '广东省',
      '杭州': '浙江省',
      '南京': '江苏省',
      '成都': '四川省',
      '武汉': '湖北省',
      '西安': '陕西省',
    }

    // 如果是直辖市，返回直辖市名称
    if (cityName in cityProvinceMap) {
      return cityProvinceMap[cityName]
    }

    // 默认返回上海市
    return '上海市'
  }

  // 根据坐标推断省份（简化版，用于云开发环境）
  const getProvinceByCoordinate = (lat: number, lng: number): string | null => {
    const provinces = [
      { name: '北京市', latRange: [39.4, 41.0], lngRange: [115.4, 117.5] },
      { name: '上海市', latRange: [30.7, 31.9], lngRange: [120.9, 122.2] },
      { name: '天津市', latRange: [38.5, 40.2], lngRange: [116.7, 118.1] },
      { name: '重庆市', latRange: [28.1, 32.2], lngRange: [105.3, 110.2] },
      { name: '广东省', latRange: [20.2, 25.5], lngRange: [109.7, 117.3] },
      { name: '江苏省', latRange: [30.7, 35.1], lngRange: [116.3, 121.9] },
      { name: '浙江省', latRange: [27.0, 31.2], lngRange: [118.0, 123.2] },
      { name: '山东省', latRange: [34.4, 38.4], lngRange: [114.8, 122.7] },
      { name: '河南省', latRange: [31.4, 36.4], lngRange: [110.4, 116.6] },
      { name: '河北省', latRange: [36.0, 42.6], lngRange: [113.5, 119.8] },
      { name: '四川省', latRange: [26.0, 34.0], lngRange: [97.3, 108.5] },
      { name: '湖北省', latRange: [29.0, 33.3], lngRange: [108.4, 116.1] },
      { name: '湖南省', latRange: [24.6, 30.1], lngRange: [108.8, 114.2] },
      { name: '福建省', latRange: [23.5, 28.3], lngRange: [115.8, 120.7] },
      { name: '安徽省', latRange: [29.4, 34.7], lngRange: [114.9, 119.6] },
      { name: '辽宁省', latRange: [38.7, 43.5], lngRange: [118.9, 125.8] },
      { name: '吉林省', latRange: [40.9, 46.3], lngRange: [121.6, 131.3] },
      { name: '黑龙江省', latRange: [43.4, 53.5], lngRange: [121.2, 135.1] },
      { name: '陕西省', latRange: [31.7, 39.6], lngRange: [105.5, 111.2] },
      { name: '山西省', latRange: [34.6, 40.7], lngRange: [110.2, 114.5] },
      { name: '江西省', latRange: [24.5, 30.1], lngRange: [113.6, 118.5] },
      { name: '广西壮族自治区', latRange: [20.5, 26.4], lngRange: [104.5, 112.0] },
      { name: '云南省', latRange: [21.1, 29.3], lngRange: [97.5, 106.2] },
      { name: '贵州省', latRange: [24.6, 29.2], lngRange: [103.6, 109.6] },
      { name: '海南省', latRange: [18.2, 20.2], lngRange: [108.6, 111.1] },
      { name: '甘肃省', latRange: [32.6, 42.8], lngRange: [92.3, 108.7] },
      { name: '青海省', latRange: [31.6, 39.2], lngRange: [89.4, 103.0] },
      { name: '内蒙古自治区', latRange: [37.4, 53.4], lngRange: [97.2, 126.0] },
      { name: '新疆维吾尔自治区', latRange: [34.4, 49.2], lngRange: [73.4, 96.4] },
      { name: '西藏自治区', latRange: [26.8, 36.5], lngRange: [78.4, 99.1] },
      { name: '宁夏回族自治区', latRange: [35.2, 39.4], lngRange: [104.3, 107.7] },
    ]

    for (const province of provinces) {
      if (
        lat >= province.latRange[0] &&
        lat <= province.latRange[1] &&
        lng >= province.lngRange[0] &&
        lng <= province.lngRange[1]
      ) {
        return province.name
      }
    }

    return null
  }

  useLoad(() => {
    console.log('通知设置页面加载')

    // 获取用户城市信息
    getUserCity()

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
        <View className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 mb-4">
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

        {/* 🔧 授权有效期提示 */}
        <View className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl p-4">
          <View className="flex flex-row items-start gap-2">
            <Text className="text-base">⚠️</Text>
            <View className="flex-1">
              <Text className="block text-sm font-semibold text-orange-600 mb-1">
                重要提示
              </Text>
              <Text className="block text-xs text-orange-600 leading-relaxed">
                微信订阅消息授权有效期为 24 小时，过期后需要重新开启调价提醒才能接收通知。
                {'\n\n'}
                {lastSubscribedAt && `📅 ${lastSubscribedAt}`}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}

export default NoticePage
