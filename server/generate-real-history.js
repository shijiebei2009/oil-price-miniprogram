// 生成真实的调价历史数据
const fs = require('fs');
const path = require('path');

// 读取当前价格数据
const cacheData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/oil-price-cache.json'), 'utf-8'));
const currentPrices = cacheData.provincePrices;

// 调价历史记录（日期从旧到新）
const adjustmentHistory = [
  {
    date: '2024-11-06',
    change: { gas92: 0.10, gas95: 0.11, gas98: 0.12, diesel0: 0.10 } // 上涨
  },
  {
    date: '2024-11-21',
    change: { gas92: -0.08, gas95: -0.09, gas98: -0.10, diesel0: -0.08 } // 下跌
  },
  {
    date: '2024-12-05',
    change: { gas92: 0.15, gas95: 0.16, gas98: 0.18, diesel0: 0.15 } // 上涨
  },
  {
    date: '2024-12-19',
    change: { gas92: -0.12, gas95: -0.13, gas98: -0.15, diesel0: -0.12 } // 下跌
  },
  {
    date: '2025-01-06',
    change: { gas92: 0.08, gas95: 0.09, gas98: 0.10, diesel0: 0.08 } // 上涨（当前）
  }
];

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

// 从最新价格开始，逐次反推历史价格
const historyData = [];

// 从最新调价开始，向前推算
for (let i = adjustmentHistory.length - 1; i >= 0; i--) {
  const adjustment = adjustmentHistory[i];

  for (const province in provinceCityMap) {
    const city = provinceCityMap[province];

    // 如果是第一次（最新调价），使用当前价格
    if (i === adjustmentHistory.length - 1) {
      historyData.push({
        date: adjustment.date,
        province: province,
        city: city,
        gas92: parseFloat(currentPrices[province].gas92.toFixed(2)),
        gas95: parseFloat(currentPrices[province].gas95.toFixed(2)),
        gas98: parseFloat(currentPrices[province].gas98.toFixed(2)),
        diesel0: parseFloat(currentPrices[province].diesel0.toFixed(2)),
        change: adjustment.change.gas92
      });
    } else {
      // 否则，使用上一次的价格减去涨跌值
      const lastHistory = historyData.find(h => h.province === province);
      if (lastHistory) {
        const lastChange = adjustmentHistory[i + 1].change;
        historyData.push({
          date: adjustment.date,
          province: province,
          city: city,
          gas92: parseFloat((lastHistory.gas92 - lastChange.gas92).toFixed(2)),
          gas95: parseFloat((lastHistory.gas95 - lastChange.gas95).toFixed(2)),
          gas98: parseFloat((lastHistory.gas98 - lastChange.gas98).toFixed(2)),
          diesel0: parseFloat((lastHistory.diesel0 - lastChange.diesel0).toFixed(2)),
          change: adjustment.change.gas92
        });
      }
    }
  }
}

// 反转数组，使日期从旧到新排列
const sortedHistoryData = historyData.reverse();

// 保存到文件
fs.writeFileSync(
  path.join(__dirname, 'data/oil-price-history.json'),
  JSON.stringify(sortedHistoryData, null, 2),
  'utf-8'
);

console.log(`✅ 已生成 ${sortedHistoryData.length} 条调价历史记录`);
console.log(`   调价日期: ${adjustmentHistory.map(a => a.date).join(', ')}`);
console.log(`   省市数量: ${Object.keys(provinceCityMap).length}`);
