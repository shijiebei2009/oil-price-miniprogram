// 云函数入口文件
const cloud = require('wx-server-sdk')
const https = require('https')
const http = require('http')

// 初始化云开发环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV // 使用当前云环境
})

const db = cloud.database()
const _ = db.command

// API 密钥（从环境变量获取）
const TIANAPI_KEY = process.env.TIANAPI_KEY || 'your-tianapi-key'
const JUHE_API_KEY = process.env.JUHE_API_KEY || 'your-juhe-api-key'

// 数据集合名称
const COLLECTION_DAILY_PRICE = 'daily_oil_prices' // 每日价格历史
const COLLECTION_ADJUSTMENT = 'oil_price_adjustments' // 调价历史
const COLLECTION_PRICES = 'current_oil_prices' // 当前油价

/**
 * 云函数入口
 */
exports.main = async (event, context) => {
  console.log('📅 云函数被触发:', event)
  console.log('触发类型:', event.Type)

  // 只响应定时触发器
  if (event.Type === 'Timer') {
    console.log('✅ 定时触发器激活，开始执行每日价格记录')

    try {
      // 1. 获取最新油价数据
      console.log('📊 开始获取油价数据...')
      const oilPrices = await fetchOilPrices()
      console.log('📊 成功获取油价数据:', oilPrices.length, '个省份')

      // 2. 记录每日价格
      console.log('💾 开始记录每日价格...')
      await recordDailyPrice(oilPrices)

      // 3. 检查并记录调价
      console.log('📈 开始检查调价...')
      await checkAndRecordAdjustment(oilPrices)

      console.log('✅ 每日价格记录任务完成')
      return {
        code: 200,
        msg: 'success',
        data: {
          success: true,
          provincesCount: oilPrices.length,
          timestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('❌ 每日价格记录任务失败:', error)
      return {
        code: 500,
        msg: error.message,
        data: {
          success: false,
          error: error.message
        }
      }
    }
  }

  return {
    code: 400,
    msg: 'Invalid trigger type',
    data: null
  }
}

/**
 * 从 API 获取油价数据
 * 优先级：聚合数据 > 天聚数行
 */
async function fetchOilPrices() {
  try {
    // 尝试从聚合数据获取
    const juheData = await fetchFromJuhe()
    if (juheData && juheData.length > 0) {
      console.log('✅ 从聚合数据成功获取油价')
      return juheData
    }
  } catch (error) {
    console.warn('⚠️ 聚合数据 API 获取失败:', error.message)
  }

  try {
    // 尝试从天聚数行获取
    const tianapiData = await fetchFromTianapi()
    if (tianapiData && tianapiData.length > 0) {
      console.log('✅ 从天聚数行成功获取油价')
      return tianapiData
    }
  } catch (error) {
    console.warn('⚠️ 天聚数行 API 获取失败:', error.message)
  }

  throw new Error('所有数据源均获取失败')
}

/**
 * 从聚合数据 API 获取油价
 */
async function fetchFromJuhe() {
  const url = `http://apis.juhe.cn/gnyj/query?key=${JUHE_API_KEY}`

  const data = await httpRequest(url)

  if (data.error_code !== 0) {
    throw new Error(`聚合数据 API 返回错误: ${data.reason}`)
  }

  // 解析返回的数据
  const prices = []
  if (data.result && Array.isArray(data.result)) {
    data.result.forEach((item) => {
      if (item['92h']) {
        prices.push({
          province: normalizeProvinceName(item.city),
          gas92: parseFloat(item['92h']),
          gas95: parseFloat(item['95h']),
          gas98: parseFloat(item['98h']),
          diesel0: parseFloat(item['0h']),
          updateTime: new Date().toISOString()
        })
      }
    })
  }

  return prices
}

/**
 * 从天聚数行 API 获取油价
 */
async function fetchFromTianapi() {
  // 省份列表
  const provinces = [
    '北京', '上海', '天津', '重庆',
    '河北', '山西', '内蒙古', '辽宁', '吉林', '黑龙江',
    '江苏', '浙江', '安徽', '福建', '江西', '山东',
    '河南', '湖北', '湖南', '广东', '广西', '海南',
    '四川', '贵州', '云南', '西藏',
    '陕西', '甘肃', '青海', '宁夏', '新疆'
  ]

  const prices = []

  for (const prov of provinces) {
    try {
      const url = `https://apis.tianapi.com/oilprice/index?key=${TIANAPI_KEY}&prov=${prov}`

      const data = await httpRequest(url)

      if (data.code !== 200 || !data.result) {
        console.warn(`获取 ${prov} 数据失败: ${data.msg}`)
        continue
      }

      // 解析天聚数行返回的数据
      if (data.result.city) {
        prices.push({
          province: normalizeProvinceName(data.result.city),
          gas92: parseFloat(data.result.p92),
          gas95: parseFloat(data.result.p95),
          gas98: parseFloat(data.result.p98),
          diesel0: parseFloat(data.result.p0),
          updateTime: new Date().toISOString()
        })
      }
    } catch (error) {
      console.warn(`获取 ${prov} 数据异常:`, error.message)
      continue
    }
  }

  return prices
}

/**
 * 规范化省份名称
 */
function normalizeProvinceName(name) {
  const map = {
    '北京': '北京市',
    '上海': '上海市',
    '天津': '天津市',
    '重庆': '重庆市',
    '河北': '河北省',
    '山西': '山西省',
    '内蒙古': '内蒙古自治区',
    '辽宁': '辽宁省',
    '吉林': '吉林省',
    '黑龙江': '黑龙江省',
    '江苏': '江苏省',
    '浙江': '浙江省',
    '安徽': '安徽省',
    '福建': '福建省',
    '江西': '江西省',
    '山东': '山东省',
    '河南': '河南省',
    '湖北': '湖北省',
    '湖南': '湖南省',
    '广东': '广东省',
    '广西': '广西壮族自治区',
    '海南': '海南省',
    '四川': '四川省',
    '贵州': '贵州省',
    '云南': '云南省',
    '西藏': '西藏自治区',
    '陕西': '陕西省',
    '甘肃': '甘肃省',
    '青海': '青海省',
    '宁夏': '宁夏回族自治区',
    '新疆': '新疆维吾尔自治区'
  }

  return map[name] || name
}

/**
 * 记录每日价格
 */
async function recordDailyPrice(oilPrices) {
  const today = new Date().toISOString().split('T')[0]

  // 检查今天是否已记录
  const existing = await db
    .collection(COLLECTION_DAILY_PRICE)
    .where({
      date: today
    })
    .get()

  if (existing.data.length > 0) {
    console.log(`✅ 今日价格已记录，跳过: ${today}`)
    return
  }

  console.log(`📝 开始记录今日价格: ${today}`)

  // 批量插入价格数据
  const records = oilPrices.map((price) => ({
    date: today,
    province: price.province,
    gas92: price.gas92,
    gas95: price.gas95,
    gas98: price.gas98,
    diesel0: price.diesel0,
    createTime: new Date().toISOString()
  }))

  // 分批插入（云数据库单次插入限制 20 条）
  const batchSize = 20
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize)
    await db.collection(COLLECTION_DAILY_PRICE).add({
      data: batch
    })
  }

  console.log(`✅ 成功记录 ${records.length} 条价格数据`)

  // 更新当前油价集合
  await updateCurrentPrices(oilPrices)
}

/**
 * 更新当前油价集合
 */
async function updateCurrentPrices(oilPrices) {
  // 删除旧数据
  await db.collection(COLLECTION_PRICES).where({}).remove()

  // 插入新数据
  for (const price of oilPrices) {
    await db.collection(COLLECTION_PRICES).add({
      data: {
        ...price,
        updateTime: new Date().toISOString()
      }
    })
  }

  console.log('✅ 当前油价集合已更新')
}

/**
 * 检查并记录调价
 */
async function checkAndRecordAdjustment(oilPrices) {
  const today = new Date().toISOString().split('T')[0]

  // 检查今天是否是调价日期
  const isAdjustmentDay = await checkAdjustmentDay(today)

  if (!isAdjustmentDay) {
    console.log(`✅ 今日不是调价日期: ${today}`)
    return
  }

  console.log(`📈 今日是调价日期，开始记录调价: ${today}`)

  // 获取上次调价数据（取最近的一条）
  const lastAdjustment = await db
    .collection(COLLECTION_ADJUSTMENT)
    .orderBy('date', 'desc')
    .limit(1)
    .get()

  if (lastAdjustment.data.length === 0) {
    console.log('⚠️ 没有上次调价数据，跳过调价记录')
    return
  }

  const lastPrice = lastAdjustment.data[0]

  // 为每个省份记录调价
  for (const price of oilPrices) {
    const lastProvincePrice = await db
      .collection(COLLECTION_DAILY_PRICE)
      .where({
        province: price.province,
        date: lastPrice.date
      })
      .get()

    if (lastProvincePrice.data.length > 0) {
      const lastP = lastProvincePrice.data[0]

      // 计算价格变化
      const change92 = price.gas92 - lastP.gas92
      const change95 = price.gas95 - lastP.gas95
      const change98 = price.gas98 - lastP.gas98
      const change0 = price.diesel0 - lastP.diesel0

      // 只记录有变化的省份
      if (Math.abs(change92) > 0.01 || Math.abs(change95) > 0.01 || Math.abs(change98) > 0.01 || Math.abs(change0) > 0.01) {
        await db.collection(COLLECTION_ADJUSTMENT).add({
          data: {
            date: today,
            province: price.province,
            gas92: price.gas92,
            gas95: price.gas95,
            gas98: price.gas98,
            diesel0: price.diesel0,
            change92: parseFloat(change92.toFixed(3)),
            change95: parseFloat(change95.toFixed(3)),
            change98: parseFloat(change98.toFixed(3)),
            change0: parseFloat(change0.toFixed(3)),
            createTime: new Date().toISOString()
          }
        })

        console.log(`📝 记录调价: ${price.province}, 92# 变化: ${change92.toFixed(3)}`)
      }
    }
  }

  console.log('✅ 调价记录完成')
}

/**
 * 检查今天是否是调价日期
 * 基于 2026 年官方调价日历
 */
async function checkAdjustmentDay(today) {
  // 2026 年官方调价日历（硬编码）
  const adjustmentCalendar = [
    '2026-01-05', '2026-01-18', '2026-02-01', '2026-02-17',
    '2026-03-09', '2026-03-23', '2026-04-06', '2026-04-20',
    '2026-05-06', '2026-05-20', '2026-06-04', '2026-06-18',
    '2026-07-02', '2026-07-16', '2026-07-30', '2026-08-13',
    '2026-08-27', '2026-09-10', '2026-09-24', '2026-10-10',
    '2026-10-24', '2026-11-07', '2026-11-21', '2026-12-05',
    '2026-12-19'
  ]

  return adjustmentCalendar.includes(today)
}

/**
 * 发送 HTTP 请求（支持 http 和 https）
 */
function httpRequest(url) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https')
    const client = isHttps ? https : http

    const req = client.get(url, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          resolve(json)
        } catch (error) {
          reject(new Error(`JSON 解析失败: ${error.message}`))
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    req.setTimeout(10000, () => {
      req.destroy()
      reject(new Error('请求超时'))
    })
  })
}
