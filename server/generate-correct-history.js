// 根据用户提供的正确调价记录生成历史数据
const fs = require('fs');
const path = require('path');

// 用户提供的 4 次调价记录（所有省市统一价格）
const adjustmentRecords = [
  {
    date: '2026-01-06',
    gas92: 6.67,
    gas95: 7.10,
    gas98: 9.10,
    diesel0: 6.31
  },
  {
    date: '2026-01-20',
    gas92: 6.74,
    gas95: 7.17,
    gas98: 9.17,
    diesel0: 6.39
  },
  {
    date: '2026-02-03',
    gas92: 6.90,
    gas95: 7.34,
    gas98: 9.34,
    diesel0: 6.55
  },
  {
    date: '2026-02-24',
    gas92: 7.04,
    gas95: 7.49,
    gas98: 9.49,
    diesel0: 6.70
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

// 生成历史数据
const historyData = [];

adjustmentRecords.forEach((record, index) => {
  // 计算涨跌幅度（相对于上一次调价）
  let change = 0;
  if (index > 0) {
    const prevRecord = adjustmentRecords[index - 1];
    change = record.gas92 - prevRecord.gas92;
  }

  // 为每个省市生成记录
  for (const province in provinceCityMap) {
    const city = provinceCityMap[province];

    historyData.push({
      date: record.date,
      province: province,
      city: city,
      gas92: record.gas92,
      gas95: record.gas95,
      gas98: record.gas98,
      diesel0: record.diesel0,
      change: parseFloat(change.toFixed(3))
    });
  }
});

// 保存到文件
fs.writeFileSync(
  path.join(__dirname, 'data/oil-price-history.json'),
  JSON.stringify(historyData, null, 2),
  'utf-8'
);

console.log('✅ 已生成正确的调价历史数据');
console.log('   调价次数:', adjustmentRecords.length);
console.log('   调价日期:', adjustmentRecords.map(r => r.date).join(', '));
console.log('   记录数量:', historyData.length);
console.log('   省市数量:', Object.keys(provinceCityMap).length);

// 显示价格走势
console.log('\n92# 价格走势:');
adjustmentRecords.forEach((r, i) => {
  const prev = i > 0 ? adjustmentRecords[i - 1] : null;
  const change = prev ? (r.gas92 - prev.gas92).toFixed(3) : '首次';
  console.log(`  ${r.date}: ${r.gas92} (${change})`);
});
