/**
 * 微信云开发网络请求封装
 */
import Taro from '@tarojs/taro'

// 检测是否在云开发环境且已开通云开发服务
export const isCloudEnv = () => {
  // 检测是否在微信小程序环境且云开发已初始化
  return Taro.getEnv() === Taro.ENV_TYPE.WEAPP && typeof wx !== 'undefined' && typeof wx.cloud !== 'undefined'
}

// 云函数调用
export const callCloudFunction = async (name: string, data: any) => {
  console.log('[CloudFunction] 调用云函数:', name, data)

  if (!isCloudEnv()) {
    console.error('[CloudFunction] 云开发环境未初始化')
    throw new Error('云开发环境未初始化')
  }

  try {
    const result = await wx.cloud.callFunction({
      name,
      data
    })

    console.log('[CloudFunction] 云函数响应:', result)

    if (result.errMsg !== 'cloud.callFunction:ok') {
      throw new Error(result.errMsg)
    }

    return result.result
  } catch (error) {
    console.error('[CloudFunction] 云函数调用失败:', error)
    throw error
  }
}

// 获取油价数据
export const getOilPrice = async (action: string, params?: any) => {
  return callCloudFunction('get-oil-price', {
    action,
    ...params
  })
}

// 获取当前油价
export const getCurrentPrice = async (province?: string) => {
  return getOilPrice('getProvinceCurrent', { province })
}

// 获取省份列表
export const getProvinceList = async () => {
  return getOilPrice('getProvinceList')
}

// 获取历史价格
export const getHistoryPrice = async (count?: number) => {
  return getOilPrice('getHistory', { count })
}

// 获取每日价格历史
export const getDailyHistoryPrice = async (days?: number) => {
  return getOilPrice('getDailyHistory', { days })
}

// 获取所有省份价格对比
export const getAllProvincePrices = async () => {
  return getOilPrice('getAllProvincePrices')
}
