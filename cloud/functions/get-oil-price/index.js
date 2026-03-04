// 云函数入口文件
const cloud = require('wx-server-sdk')

// 初始化云开发环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 数据集合名称
const COLLECTION_CURRENT = 'current_oil_prices'
const COLLECTION_DAILY = 'daily_oil_prices'
const COLLECTION_ADJUSTMENT = 'oil_price_adjustments'

/**
 * 云函数入口
 */
exports.main = async (event, context) => {
  console.log('收到请求:', event)

  const { action, province, city, count, days } = event

  try {
    switch (action) {
      case 'getCurrent':
        return await getCurrentPrice(province)
      case 'getProvinceCurrent':
        return await getProvinceCurrentPrice(province)
      case 'getCityList':
        return await getCityList()
      case 'getProvinceList':
        return await getProvinceList()
      case 'getAllCityPrices':
        return await getAllCityPrices()
      case 'getAllProvincePrices':
        return await getAllProvincePrices()
      case 'getHistory':
        return await getHistoryPrice(count)
      case 'getDailyHistory':
        return await getDailyHistoryPrice(days)
      default:
        throw new Error('Invalid action')
    }
  } catch (error) {
    console.error('云函数执行失败:', error)
    return {
      code: 500,
      msg: error.message,
      data: null
    }
  }
}

/**
 * 获取当前油价（支持城市参数）
 */
async function getCurrentPrice(city) {
  const query = city ? { province: city } : {}

  const result = await db
    .collection(COLLECTION_CURRENT)
    .where(query)
    .get()

  if (result.data.length === 0) {
    return {
      code: 404,
      msg: '暂无数据',
      data: null
    }
  }

  const price = result.data[0]
  const currentPrices = [
    { name: '92号汽油', price: price.gas92, previousPrice: 0, change: 0 },
    { name: '95号汽油', price: price.gas95, previousPrice: 0, change: 0 },
    { name: '98号汽油', price: price.gas98, previousPrice: 0, change: 0 },
    { name: '0号柴油', price: price.diesel0, previousPrice: 0, change: 0 }
  ]

  return {
    code: 200,
    msg: 'success',
    data: {
      currentPrices,
      nextAdjustment: await getNextAdjustment(),
      updateTime: price.updateTime,
      cityName: price.province,
      provinceName: price.province
    }
  }
}

/**
 * 获取当前油价（支持省份参数）
 */
async function getProvinceCurrentPrice(province) {
  if (!province) {
    // 如果没有指定省份，返回第一个省份的数据
    const result = await db
      .collection(COLLECTION_CURRENT)
      .limit(1)
      .get()

    if (result.data.length === 0) {
      return {
        code: 404,
        msg: '暂无数据',
        data: null
      }
    }

    return await getProvinceCurrentPrice(result.data[0].province)
  }

  const result = await db
    .collection(COLLECTION_CURRENT)
    .where({ province })
    .get()

  if (result.data.length === 0) {
    return {
      code: 404,
      msg: '暂无数据',
      data: null
    }
  }

  const price = result.data[0]

  // 获取昨日价格（用于计算变化）
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayDate = yesterday.toISOString().split('T')[0]

  const yesterdayPrice = await db
    .collection(COLLECTION_DAILY)
    .where({
      province,
      date: yesterdayDate
    })
    .get()

  const previousPrice = yesterdayPrice.data.length > 0 ? yesterdayPrice.data[0] : null

  const currentPrices = [
    {
      name: '92号汽油',
      price: price.gas92,
      previousPrice: previousPrice ? previousPrice.gas92 : price.gas92,
      change: previousPrice ? parseFloat((price.gas92 - previousPrice.gas92).toFixed(3)) : 0
    },
    {
      name: '95号汽油',
      price: price.gas95,
      previousPrice: previousPrice ? previousPrice.gas95 : price.gas95,
      change: previousPrice ? parseFloat((price.gas95 - previousPrice.gas95).toFixed(3)) : 0
    },
    {
      name: '98号汽油',
      price: price.gas98,
      previousPrice: previousPrice ? previousPrice.gas98 : price.gas98,
      change: previousPrice ? parseFloat((price.gas98 - previousPrice.gas98).toFixed(3)) : 0
    },
    {
      name: '0号柴油',
      price: price.diesel0,
      previousPrice: previousPrice ? previousPrice.diesel0 : price.diesel0,
      change: previousPrice ? parseFloat((price.diesel0 - previousPrice.diesel0).toFixed(3)) : 0
    }
  ]

  return {
    code: 200,
    msg: 'success',
    data: {
      currentPrices,
      nextAdjustment: await getNextAdjustment(),
      updateTime: price.updateTime,
      cityName: province,
      provinceName: province
    }
  }
}

/**
 * 获取城市列表
 */
async function getCityList() {
  const result = await db
    .collection(COLLECTION_CURRENT)
    .get()

  const cities = result.data.map(item => ({
    name: item.province,
    region: '', // 可以从其他集合获取
    level: 1,
    gas92: item.gas92,
    gas95: item.gas95,
    gas98: item.gas98,
    diesel0: item.diesel0
  }))

  return {
    code: 200,
    msg: 'success',
    data: cities
  }
}

/**
 * 获取省份列表
 */
async function getProvinceList() {
  const result = await db
    .collection(COLLECTION_CURRENT)
    .get()

  const provinces = result.data.map(item => ({
    name: item.province,
    region: '', // 可以从其他集合获取
    level: 1,
    gas92: item.gas92,
    gas95: item.gas95,
    gas98: item.gas98,
    diesel0: item.diesel0
  }))

  return {
    code: 200,
    msg: 'success',
    data: provinces
  }
}

/**
 * 获取所有城市价格对比
 */
async function getAllCityPrices() {
  const result = await db
    .collection(COLLECTION_CURRENT)
    .get()

  return {
    code: 200,
    msg: 'success',
    data: result.data
  }
}

/**
 * 获取所有省份价格对比
 */
async function getAllProvincePrices() {
  const result = await db
    .collection(COLLECTION_CURRENT)
    .get()

  return {
    code: 200,
    msg: 'success',
    data: result.data
  }
}

/**
 * 获取历史价格（按调价次数查询）
 */
async function getHistoryPrice(count = 10) {
  const result = await db
    .collection(COLLECTION_ADJUSTMENT)
    .orderBy('date', 'desc')
    .limit(count)
    .get()

  const history = result.data.map(item => ({
    date: item.date,
    province: item.province,
    gas92: item.gas92,
    gas95: item.gas95,
    gas98: item.gas98,
    diesel0: item.diesel0,
    change: item.change92 || 0
  }))

  return {
    code: 200,
    msg: 'success',
    data: history
  }
}

/**
 * 获取每日价格历史（按天数查询）
 */
async function getDailyHistoryPrice(days = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const result = await db
    .collection(COLLECTION_DAILY)
    .where({
      date: _.gte(startDate.toISOString().split('T')[0])
    })
    .orderBy('date', 'asc')
    .get()

  return {
    code: 200,
    msg: 'success',
    data: result.data
  }
}

/**
 * 获取下次调价信息
 */
async function getNextAdjustment() {
  const today = new Date().toISOString().split('T')[0]

  // 2026 年官方调价日历
  const adjustmentCalendar = [
    '2026-01-05', '2026-01-18', '2026-02-01', '2026-02-17',
    '2026-03-09', '2026-03-23', '2026-04-06', '2026-04-20',
    '2026-05-06', '2026-05-20', '2026-06-04', '2026-06-18',
    '2026-07-02', '2026-07-16', '2026-07-30', '2026-08-13',
    '2026-08-27', '2026-09-10', '2026-09-24', '2026-10-10',
    '2026-10-24', '2026-11-07', '2026-11-21', '2026-12-05',
    '2026-12-19'
  ]

  // 查找下一个调价日期
  let nextDate = null
  for (const date of adjustmentCalendar) {
    if (date > today) {
      nextDate = date
      break
    }
  }

  if (!nextDate) {
    return {
      date: '',
      time: '',
      direction: 'stable',
      expectedChange: 0,
      daysRemaining: 0,
      trend: '暂无调价信息'
    }
  }

  // 计算距离下次调价的天数
  const todayObj = new Date(today)
  const nextObj = new Date(nextDate)
  const daysRemaining = Math.ceil((nextObj - todayObj) / (1000 * 60 * 60 * 24))

  // 获取最新价格，用于预测调价方向
  const latestPrice = await db
    .collection(COLLECTION_CURRENT)
    .limit(1)
    .get()

  let direction = 'stable'
  let expectedChange = 0
  let trend = '暂无调价信息'

  if (latestPrice.data.length > 0) {
    // 这里可以基于价格历史计算调价预测
    // 简化处理：假设与上次调价方向相同
    const lastAdjustment = await db
      .collection(COLLECTION_ADJUSTMENT)
      .orderBy('date', 'desc')
      .limit(1)
      .get()

    if (lastAdjustment.data.length > 0) {
      const lastChange = lastAdjustment.data[0].change92
      direction = lastChange > 0 ? 'up' : lastChange < 0 ? 'down' : 'stable'
      expectedChange = Math.abs(lastChange) * 0.8 // 假设变化幅度缩小
      trend = `根据历史调价记录，预计下次调价可能${direction === 'up' ? '上涨' : direction === 'down' ? '下跌' : '持平'} ${expectedChange.toFixed(3)} 元/升左右`
    }
  }

  return {
    date: nextDate,
    time: '24时',
    direction,
    expectedChange,
    daysRemaining,
    trend
  }
}
