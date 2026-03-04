// 生成34个省市的4次调价记录

const provinces = [
  { name: '北京市', city: '北京' },
  { name: '天津市', city: '天津' },
  { name: '河北省', city: '石家庄' },
  { name: '山西省', city: '太原' },
  { name: '内蒙古自治区', city: '呼和浩特' },
  { name: '辽宁省', city: '沈阳' },
  { name: '吉林省', city: '长春' },
  { name: '黑龙江省', city: '哈尔滨' },
  { name: '上海市', city: '上海' },
  { name: '江苏省', city: '南京' },
  { name: '浙江省', city: '杭州' },
  { name: '安徽省', city: '合肥' },
  { name: '福建省', city: '福州' },
  { name: '江西省', city: '南昌' },
  { name: '山东省', city: '济南' },
  { name: '河南省', city: '郑州' },
  { name: '湖北省', city: '武汉' },
  { name: '湖南省', city: '长沙' },
  { name: '广东省', city: '广州' },
  { name: '广西壮族自治区', city: '南宁' },
  { name: '海南省', city: '海口' },
  { name: '重庆市', city: '重庆' },
  { name: '四川省', city: '成都' },
  { name: '贵州省', city: '贵阳' },
  { name: '云南省', city: '昆明' },
  { name: '西藏自治区', city: '拉萨' },
  { name: '陕西省', city: '西安' },
  { name: '甘肃省', city: '兰州' },
  { name: '青海省', city: '西宁' },
  { name: '宁夏回族自治区', city: '银川' },
  { name: '新疆维吾尔自治区', city: '乌鲁木齐' },
]

// 4次调价记录（用户提供的基准价格，所有省市使用相同价格）
const adjustments = [
  { date: '2026-02-25', gas92: 7.04, gas95: 7.49, gas98: 9.49, diesel0: 6.70 },
  { date: '2026-02-04', gas92: 6.90, gas95: 7.34, gas98: 9.34, diesel0: 6.55 },
  { date: '2026-01-21', gas92: 6.74, gas95: 7.17, gas98: 9.17, diesel0: 6.39 },
  { date: '2026-01-07', gas92: 6.67, gas95: 7.10, gas98: 9.10, diesel0: 6.31 },
]

// 生成所有省市的调价记录
const historyData = []

adjustments.forEach((adjustment, adjIndex) => {
  provinces.forEach(province => {
    // 计算变化量
    const prevAdjustment = adjustments[adjIndex - 1]
    let change = 0
    if (prevAdjustment) {
      change = parseFloat((adjustment.gas92 - prevAdjustment.gas92).toFixed(2))
    }

    historyData.push({
      date: adjustment.date,
      province: province.name,
      city: province.city,
      gas92: parseFloat(adjustment.gas92.toFixed(2)),
      gas95: parseFloat(adjustment.gas95.toFixed(2)),
      gas98: parseFloat(adjustment.gas98.toFixed(2)),
      diesel0: parseFloat(adjustment.diesel0.toFixed(2)),
      change: parseFloat(change.toFixed(2))
    })
  })
})

console.log(JSON.stringify(historyData, null, 2))
