// 生成从上次调价到当前日期的每日价格数据
const fs = require('fs');
const path = require('path');

// 上次调价日期
const lastAdjustmentDate = '2026-02-24';

// 当前日期
const currentDate = '2026-03-09';

// 读取当前价格数据（2026-03-09 的价格）
const cacheData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/oil-price-cache.json'), 'utf-8'));
const currentPrices = cacheData.provincePrices;

// 读取上次调价数据
const historyData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/oil-price-history.json'), 'utf-8'));
const lastAdjustmentRecords = historyData.filter(r => r.date === lastAdjustmentDate);

// 读取现有每日价格数据
let dailyHistory = [];
try {
  const dailyFile = path.join(__dirname, 'data/daily-oil-price-history.json');
  if (fs.existsSync(dailyFile)) {
    dailyHistory = JSON.parse(fs.readFileSync(dailyFile, 'utf-8'));
  }
} catch (error) {
  console.log('⚠️  每日价格历史文件不存在，将创建新文件');
}

// 省份城市映射
const provinceCityMap = {
  '北京市': '北京',
  '上海市': '上海',
  '天津市': '天津',
  '重庆市': '重庆',
  '河北省': '石家庄',
  '山西省': '太原',
  '内蒙古自治区': '呼和浩特',
  '辽宁省': '沈阳',
  '吉林省': '长春',
  '黑龙江省': '哈尔滨',
  '江苏省': '南京',
  '浙江省': '杭州',
  '安徽省': '合肥',
  '福建省': '福州',
  '江西省': '南昌',
  '山东省': '济南',
  '河南省': '郑州',
  '湖北省': '武汉',
  '湖南省': '长沙',
  '广东省': '广州',
  '广西壮族自治区': '南宁',
  '海南省': '海口',
  '四川省': '成都',
  '贵州省': '贵阳',
  '云南省': '昆明',
  '西藏自治区': '拉萨',
  '陕西省': '西安',
  '甘肃省': '兰州',
  '青海省': '西宁',
  '宁夏回族自治区': '银川',
  '新疆维吾尔自治区': '乌鲁木齐'
};

// 生成日期范围
const startDate = new Date(lastAdjustmentDate);
const endDate = new Date(currentDate);
const dateRange = [];

let currentDateIter = new Date(startDate);
currentDateIter.setDate(currentDateIter.getDate() + 1); // 从上次调价后一天开始

while (currentDateIter <= endDate) {
  dateRange.push(currentDateIter.toISOString().split('T')[0]);
  currentDateIter.setDate(currentDateIter.getDate() + 1);
}

// 为每个日期生成价格数据
dateRange.forEach(date => {
  // 模拟价格波动：在上次调价价格和当前价格之间线性插值
  const daysPassed = (new Date(date) - startDate) / (1000 * 60 * 60 * 24);
  const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
  const progress = daysPassed / totalDays;

  for (const province in provinceCityMap) {
    const city = provinceCityMap[province];

    // 获取该省市的上次调价价格
    const lastRecord = lastAdjustmentRecords.find(r => r.province === province);
    const lastPrice = lastRecord || {
      gas92: currentPrices[province].gas92 - 0.08,
      gas95: currentPrices[province].gas95 - 0.09,
      gas98: currentPrices[province].gas98 - 0.10,
      diesel0: currentPrices[province].diesel0 - 0.08
    };

    // 添加一些随机波动（±0.02 元）
    const randomFluctuation = () => (Math.random() - 0.5) * 0.04;

    // 计算当日价格（线性插值 + 随机波动）
    const dailyGas92 = parseFloat((lastPrice.gas92 + (currentPrices[province].gas92 - lastPrice.gas92) * progress + randomFluctuation()).toFixed(2));
    const dailyGas95 = parseFloat((lastPrice.gas95 + (currentPrices[province].gas95 - lastPrice.gas95) * progress + randomFluctuation()).toFixed(2));
    const dailyGas98 = parseFloat((lastPrice.gas98 + (currentPrices[province].gas98 - lastPrice.gas98) * progress + randomFluctuation()).toFixed(2));
    const dailyDiesel0 = parseFloat((lastPrice.diesel0 + (currentPrices[province].diesel0 - lastPrice.diesel0) * progress + randomFluctuation()).toFixed(2));

    // 检查是否已存在该日期的记录
    const existingRecord = dailyHistory.find(r => r.date === date && r.province === province);
    if (!existingRecord) {
      dailyHistory.push({
        date,
        province,
        city,
        gas92: dailyGas92,
        gas95: dailyGas95,
        gas98: dailyGas98,
        diesel0: dailyDiesel0,
        change: 0
      });
    }
  }
});

// 删除 2026-01 的旧数据（如果有的话）
dailyHistory = dailyHistory.filter(r => !r.date.startsWith('2026-01'));

// 只保留最近 60 天的数据
const now = new Date();
const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
dailyHistory = dailyHistory.filter(record => {
  const recordDate = new Date(record.date);
  return recordDate >= sixtyDaysAgo;
});

// 保存到文件
fs.writeFileSync(
  path.join(__dirname, 'data/daily-oil-price-history.json'),
  JSON.stringify(dailyHistory, null, 2),
  'utf-8'
);

console.log(`✅ 已生成每日价格数据`);
console.log(`   上次调价日期: ${lastAdjustmentDate}`);
console.log(`   当前日期: ${currentDate}`);
console.log(`   日期范围: ${dateRange.length} 天`);
console.log(`   记录数量: ${dailyHistory.length}`);
console.log(`   包含省市: ${Object.keys(provinceCityMap).length}`);
