#!/usr/bin/env node
/**
 * 重新生成历史数据文件（按省市维度）
 * 由于历史数据缺失，复用当前价格填充历史
 */

const fs = require('fs')
const path = require('path')

// 数据文件路径
const dataDir = path.join(__dirname, 'server/data')
const historyFilePath = path.join(dataDir, 'oil-price-history.json')
const dailyHistoryFilePath = path.join(dataDir, 'daily-oil-price-history.json')

// 确保目录存在
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// 省市列表（从 service 中复制）
const PROVINCES = [
  { name: '北京市', region: '华北', level: 1 },
  { name: '上海市', region: '华东', level: 1 },
  { name: '天津市', region: '华北', level: 1 },
  { name: '重庆市', region: '西南', level: 1 },
  { name: '河北省', region: '华北', level: 2 },
  { name: '山西省', region: '华北', level: 2 },
  { name: '辽宁省', region: '东北', level: 2 },
  { name: '吉林省', region: '东北', level: 2 },
  { name: '黑龙江省', region: '东北', level: 2 },
  { name: '江苏省', region: '华东', level: 1 },
  { name: '浙江省', region: '华东', level: 1 },
  { name: '安徽省', region: '华东', level: 2 },
  { name: '福建省', region: '华东', level: 2 },
  { name: '江西省', region: '华东', level: 2 },
  { name: '山东省', region: '华东', level: 1 },
  { name: '河南省', region: '华中', level: 2 },
  { name: '湖北省', region: '华中', level: 2 },
  { name: '湖南省', region: '华中', level: 2 },
  { name: '广东省', region: '华南', level: 1 },
  { name: '广西壮族自治区', region: '华南', level: 2 },
  { name: '海南省', region: '华南', level: 3 },
  { name: '四川省', region: '西南', level: 2 },
  { name: '贵州省', region: '西南', level: 3 },
  { name: '云南省', region: '西南', level: 3 },
  { name: '西藏自治区', region: '西南', level: 3 },
  { name: '陕西省', region: '西北', level: 2 },
  { name: '甘肃省', region: '西北', level: 3 },
  { name: '青海省', region: '西北', level: 3 },
  { name: '宁夏回族自治区', region: '西北', level: 3 },
  { name: '新疆维吾尔自治区', region: '西北', level: 3 },
  { name: '内蒙古自治区', region: '华北', level: 3 },
]

const CITIES = [
  { name: '北京', province: '北京市' },
  { name: '上海', province: '上海市' },
  { name: '天津', province: '天津市' },
  { name: '重庆', province: '重庆市' },
  { name: '广州', province: '广东省' },
  { name: '深圳', province: '广东省' },
  { name: '杭州', province: '浙江省' },
  { name: '南京', province: '江苏省' },
  { name: '成都', province: '四川省' },
  { name: '武汉', province: '湖北省' },
  { name: '西安', province: '陕西省' },
  { name: '苏州', province: '江苏省' },
  { name: '长沙', province: '湖南省' },
  { name: '郑州', province: '河南省' },
  { name: '青岛', province: '山东省' },
  { name: '合肥', province: '安徽省' },
  { name: '济南', province: '山东省' },
  { name: '福州', province: '福建省' },
  { name: '南昌', province: '江西省' },
  { name: '南宁', province: '广西壮族自治区' },
  { name: '海口', province: '海南省' },
  { name: '贵阳', province: '贵州省' },
  { name: '昆明', province: '云南省' },
  { name: '兰州', province: '甘肃省' },
  { name: '银川', province: '宁夏回族自治区' },
  { name: '西宁', province: '青海省' },
  { name: '乌鲁木齐', province: '新疆维吾尔自治区' },
  { name: '拉萨', province: '西藏自治区' },
  { name: '呼和浩特', province: '内蒙古自治区' },
  { name: '石家庄', province: '河北省' },
  { name: '太原', province: '山西省' },
  { name: '长春', province: '吉林省' },
  { name: '哈尔滨', province: '黑龙江省' },
  { name: '沈阳', province: '辽宁省' },
  { name: '大连', province: '辽宁省' },
  { name: '宁波', province: '浙江省' },
  { name: '厦门', province: '福建省' },
  { name: '温州', province: '浙江省' },
]

// 城市价格数据（从 service 中复制）
const cityPriceModifiers = {
  '北京': { gas92: 0.03, gas95: 0.03, gas98: 0.03, diesel0: 0.03 },
  '上海': { gas92: 0.01, gas95: 0.01, gas98: 0.01, diesel0: 0.01 },
  '广州': { gas92: 0.04, gas95: 0.04, gas98: 0.04, diesel0: 0.04 },
  '深圳': { gas92: 0.04, gas95: 0.04, gas98: 0.04, diesel0: 0.04 },
  '杭州': { gas92: 0.02, gas95: 0.02, gas98: 0.02, diesel0: 0.02 },
  '南京': { gas92: 0.02, gas95: 0.02, gas98: 0.02, diesel0: 0.02 },
  '成都': { gas92: 0.01, gas95: 0.01, gas98: 0.01, diesel0: 0.01 },
  '武汉': { gas92: 0.01, gas95: 0.01, gas98: 0.01, diesel0: 0.01 },
  '西安': { gas92: 0.00, gas95: 0.00, gas98: 0.00, diesel0: 0.00 },
  '天津': { gas92: 0.02, gas95: 0.02, gas98: 0.02, diesel0: 0.02 },
  '苏州': { gas92: 0.02, gas95: 0.02, gas98: 0.02, diesel0: 0.02 },
  '长沙': { gas92: 0.01, gas95: 0.01, gas98: 0.01, diesel0: 0.01 },
  '郑州': { gas92: 0.01, gas95: 0.01, gas98: 0.01, diesel0: 0.01 },
  '青岛': { gas92: 0.01, gas95: 0.01, gas98: 0.01, diesel0: 0.01 },
  '合肥': { gas92: 0.01, gas95: 0.01, gas98: 0.01, diesel0: 0.01 },
  '济南': { gas92: 0.01, gas95: 0.01, gas98: 0.01, diesel0: 0.01 },
  '福州': { gas92: 0.01, gas95: 0.01, gas98: 0.01, diesel0: 0.01 },
  '南昌': { gas92: 0.01, gas95: 0.01, gas98: 0.01, diesel0: 0.01 },
  '南宁': { gas92: 0.02, gas95: 0.02, gas98: 0.02, diesel0: 0.02 },
  '海口': { gas92: 0.03, gas95: 0.03, gas98: 0.03, diesel0: 0.03 },
  '贵阳': { gas92: 0.01, gas95: 0.01, gas98: 0.01, diesel0: 0.01 },
  '昆明': { gas92: 0.01, gas95: 0.01, gas98: 0.01, diesel0: 0.01 },
  '兰州': { gas92: 0.00, gas95: 0.00, gas98: 0.00, diesel0: 0.00 },
  '银川': { gas92: 0.00, gas95: 0.00, gas98: 0.00, diesel0: 0.00 },
  '西宁': { gas92: 0.00, gas95: 0.00, gas98: 0.00, diesel0: 0.00 },
  '乌鲁木齐': { gas92: 0.00, gas95: 0.00, gas98: 0.00, diesel0: 0.00 },
  '拉萨': { gas92: 0.02, gas95: 0.02, gas98: 0.02, diesel0: 0.02 },
  '呼和浩特': { gas92: 0.00, gas95: 0.00, gas98: 0.00, diesel0: 0.00 },
  '石家庄': { gas92: 0.01, gas95: 0.01, gas98: 0.01, diesel0: 0.01 },
  '太原': { gas92: 0.00, gas95: 0.00, gas98: 0.00, diesel0: 0.00 },
  '长春': { gas92: 0.00, gas95: 0.00, gas98: 0.00, diesel0: 0.00 },
  '哈尔滨': { gas92: 0.00, gas95: 0.00, gas98: 0.00, diesel0: 0.00 },
  '沈阳': { gas92: 0.00, gas95: 0.00, gas98: 0.00, diesel0: 0.00 },
  '大连': { gas92: 0.01, gas95: 0.01, gas98: 0.01, diesel0: 0.01 },
  '宁波': { gas92: 0.02, gas95: 0.02, gas98: 0.02, diesel0: 0.02 },
  '厦门': { gas92: 0.02, gas95: 0.02, gas98: 0.02, diesel0: 0.02 },
  '温州': { gas92: 0.02, gas95: 0.02, gas98: 0.02, diesel0: 0.02 },
}

// 当前价格（全国平均）
const currentBasePrice = {
  gas92: 7.89,
  gas95: 8.37,
  gas98: 9.13,
  diesel0: 7.56,
}

// 调价历史日期（从旧文件中复制）
const adjustmentDates = [
  { date: '2026-02-25', change: 0.14 },
  { date: '2026-02-04', change: 0.16 },
  { date: '2026-01-21', change: 0.07 },
  { date: '2026-01-07', change: 0 },
  { date: '2025-12-23', change: -0.14 },
  { date: '2025-12-09', change: -0.04 },
  { date: '2025-11-25', change: -0.06 },
  { date: '2025-11-11', change: 0.1 },
  { date: '2025-10-28', change: -0.21 },
  { date: '2025-10-14', change: -0.06 },
  { date: '2025-09-24', change: 0 },
  { date: '2025-09-10', change: 0 },
  { date: '2025-08-27', change: 0 },
]

// 生成调价历史数据（按省市维度）
function generateAdjustmentHistory() {
  const history = []

  adjustmentDates.forEach((adj, index) => {
    // 计算该调价日期的价格（基于当前价格减去累积变化）
    let cumulativeChange = 0
    for (let i = index; i < adjustmentDates.length; i++) {
      cumulativeChange += adjustmentDates[i].change
    }

    CITIES.forEach((city) => {
      const modifier = cityPriceModifiers[city.name] || { gas92: 0.01, gas95: 0.01, gas98: 0.01, diesel0: 0.01 }

      history.push({
        date: adj.date,
        province: city.province,
        city: city.name,
        gas92: currentBasePrice.gas92 + modifier.gas92 - cumulativeChange,
        gas95: currentBasePrice.gas95 + modifier.gas95 + 0.48 - cumulativeChange,
        gas98: currentBasePrice.gas98 + modifier.gas98 + 0.76 - cumulativeChange,
        diesel0: currentBasePrice.diesel0 + modifier.diesel0 - 0.05 - cumulativeChange,
        change: adj.change
      })
    })
  })

  return history
}

// 生成每日价格历史数据（按省市维度）
function generateDailyHistory() {
  const history = []
  const now = new Date()

  // 生成最近 60 天的每日价格
  for (let i = 0; i < 60; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    CITIES.forEach((city) => {
      const modifier = cityPriceModifiers[city.name] || { gas92: 0.01, gas95: 0.01, gas98: 0.01, diesel0: 0.01 }

      history.push({
        date: dateStr,
        province: city.province,
        city: city.name,
        gas92: currentBasePrice.gas92 + modifier.gas92,
        gas95: currentBasePrice.gas95 + modifier.gas95 + 0.48,
        gas98: currentBasePrice.gas98 + modifier.gas98 + 0.76,
        diesel0: currentBasePrice.diesel0 + modifier.diesel0 - 0.05,
        change: 0
      })
    })
  }

  return history
}

// 生成数据
console.log('🔄 生成调价历史数据（按省市维度）...')
const adjustmentHistory = generateAdjustmentHistory()
console.log(`✅ 已生成 ${adjustmentHistory.length} 条调价记录`)

console.log('🔄 生成每日价格历史数据（按省市维度）...')
const dailyHistory = generateDailyHistory()
console.log(`✅ 已生成 ${dailyHistory.length} 条每日价格记录`)

// 保存到文件
fs.writeFileSync(historyFilePath, JSON.stringify(adjustmentHistory, null, 2))
console.log(`✅ 调价历史数据已保存到: ${historyFilePath}`)

fs.writeFileSync(dailyHistoryFilePath, JSON.stringify(dailyHistory, null, 2))
console.log(`✅ 每日价格历史数据已保存到: ${dailyHistoryFilePath}`)

console.log('\n✨ 历史数据生成完成！')
