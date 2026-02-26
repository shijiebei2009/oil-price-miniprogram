# Mock 数据清单

本文档列出了当前项目中所有使用 Mock 数据的地方，以便逐一替换为真实数据。

## 📊 Mock 数据总览

| 序号 | 数据来源 | 位置 | 数据类型 | 优先级 |
|------|---------|------|---------|--------|
| 1 | `generateRealHistoryData()` | `oil-price.service.ts` | 历史价格数据 | 🔴 高 |
| 2 | `getMockNextAdjustment()` | `oil-price.service.ts` | 下次调价预测 | 🟡 中 |
| 3 | `fetchFromAlternativeSource()` | `oil-price.service.ts` | 城市价格数据 | 🟡 中 |
| 4 | `currentPrices.change` | `oil-price.service.ts` | 涨跌信息 | 🟡 中 |

---

## 🔴 优先级 1：历史价格数据

### 位置
`server/src/oil-price/oil-price.service.ts` - `generateRealHistoryData()` 方法

### 问题说明
```typescript
// 使用随机数生成历史价格
const adjustment = (Math.random() - 0.45) * 0.30
currentPrice += adjustment
```

**当前行为**：
- 从180天前开始，基于真实的调价周期（每10个工作日）生成数据
- **但价格涨跌使用的是随机数**，不是真实的历史数据
- 每次调价幅度在 -0.15元 到 +0.15元 之间随机

**真实数据来源**：
- 天行数据 API：`http://api.tianapi.com/oilprice/index` (当前不可用)
- 聚合数据 API：`http://web.juhe.cn:8080/finance/oil/goldprice` (当前不可用)
- 国家发改委官网历史公告

### 替换方案

**方案1：使用真实 API（推荐）**
- 从天行数据或聚合数据获取历史价格
- 需要获取正确的 API 地址和参数

**方案2：从国家发改委网站爬取**
- 定期爬取国家发改委官网的历史调价公告
- 存储到数据库中

**方案3：手动录入历史数据**
- 手动录入近1年的历史数据
- 定期更新

---

## 🟡 优先级 2：下次调价预测

### 位置
`server/src/oil-price/oil-price.service.ts` - `getMockNextAdjustment()` 方法

### 问题说明
```typescript
// 根据最近的历史数据预测趋势（但历史数据本身就是mock的）
const recentChanges = this.realHistoryData.slice(0, 7).map(d => d.change)
const avgChange = recentChanges.reduce((sum, c) => sum + c, 0) / recentChanges.length
```

**当前行为**：
- 基于最近7天的历史数据（mock数据）预测趋势
- 使用简单的平均算法预测方向
- 调价日期固定为14天后

**真实数据来源**：
- 国家发改委调价通知
- 市场预测（如：隆众资讯、金联创等）

### 替换方案

**方案1：从专业资讯网站获取**
- 集成隆众资讯、金联创等 API
- 获取真实的调价预测

**方案2：手动更新**
- 根据国家发改委公告手动更新
- 定期维护

---

## 🟡 优先级 3：城市价格数据（备选方案）

### 位置
`server/src/oil-price/oil-price.service.ts` - `fetchFromAlternativeSource()` 方法

### 问题说明
```typescript
// 根据城市等级和地理位置调整价格（估算值）
let modifier = 0
if (['北京', '上海', '广州', '深圳'].includes(city.name)) {
  modifier = 0.08
} else if (/* 二线城市 */) {
  modifier = 0.03
} else {
  modifier = -0.02
}
```

**当前行为**：
- 基于2025年2月26日的国家发改委调价后的平均价格（真实基准）
- 根据城市等级和地理位置使用**估算系数**调整价格
- 不是真实的实时数据

**真实数据来源**：
- 天行数据 API（全国所有城市实时油价）
- 聚合数据 API（全国所有城市实时油价）
- 各地发改委官网

### 替换方案

**方案1：使用真实 API（推荐）**
- 修复天行数据 API 调用
- 修复聚合数据 API 调用

**方案2：爬取各地发改委官网**
- 定期爬取各地发改委官网的油价公告
- 存储到数据库中

---

## 🟡 优先级 4：涨跌信息

### 位置
`server/src/oil-price/oil-price.service.ts` - `getCurrentPrices()` 方法

### 问题说明
```typescript
const currentPrices: OilPrice[] = [
  {
    name: '92号汽油',
    price: cityPrice.gas92,
    change: latestHistory ? latestHistory.change : 0  // 从mock历史数据获取
  },
  // ...
]
```

**当前行为**：
- 涨跌信息来自 `latestHistory.change`
- 但历史数据是使用随机数生成的
- **不是真实的涨跌信息**

**真实数据来源**：
- 天行数据 API（包含涨跌信息）
- 聚合数据 API（包含涨跌信息）
- 国家发改委调价公告

### 替换方案

**方案1：从真实 API 获取**
- 天行数据 API 返回的数据中包含涨跌信息
- 聚合数据 API 返回的数据中包含涨跌信息

**方案2：手动计算**
- 根据真实的上一次调价公告计算涨跌

---

## ✅ 非Mock数据（真实数据）

### 1. 城市列表
**位置**：`server/src/oil-price/oil-price.service.ts` - `CITIES` 常量

**数据来源**：全国337个地级市（真实数据）

**说明**：这个是硬编码的城市列表，是真实的，不需要替换。

---

## 🎯 建议的替换顺序

### 第一阶段：修复真实 API（核心）
1. ✅ 获取天行数据正确的 API 地址和参数
2. ✅ 获取聚合数据正确的 API 地址和参数
3. ✅ 测试 API 调用
4. ✅ 替换城市价格数据和涨跌信息

### 第二阶段：历史数据
1. ✅ 从天行数据/聚合数据获取历史价格
2. ✅ 存储到数据库
3. ✅ 替换 `generateRealHistoryData()` 方法

### 第三阶段：调价预测
1. ✅ 从专业资讯网站获取预测
2. ✅ 或者手动维护预测数据
3. ✅ 替换 `getMockNextAdjustment()` 方法

---

## 📝 当前数据流程

```
服务启动
  ↓
调用 fetchRealOilPrices()
  ↓
尝试天行数据 API → 失败 → 尝试聚合数据 API → 失败 → 使用备选方案
  ↓
fetchFromAlternativeSource()（估算城市价格）
  ↓
generateRealHistoryData()（随机生成历史数据）
  ↓
getCurrentPrices()（返回数据给前端）
```

---

## 🚨 重要提示

**当前状态**：
- ✅ 系统可以正常运行
- ✅ 数据相对准确（基于国家发改委基准价格）
- ❌ 历史数据是随机生成的
- ❌ 涨跌信息不是真实的
- ❌ 调价预测不是真实的

**需要解决的问题**：
1. 修复天行数据 API 调用（API地址可能已更改）
2. 修复聚合数据 API 调用（API地址可能已更改）
3. 获取真实的历史价格数据
4. 获取真实的调价预测数据

**如何获取正确的 API 信息**：
1. 登录天行数据控制台：https://www.tianapi.com/console
2. 点击"我的接口" → "全国油价查询"
3. 查看最新的 API 文档，复制正确的 API 地址

---

## 📞 下一步行动

请从控制台获取以下信息，并提供给我：

1. **天行数据**：
   - 正确的 API 地址
   - 必填参数名称
   - 返回数据格式示例

2. **聚合数据**：
   - 正确的 API 地址
   - 必填参数名称
   - 返回数据格式示例

获取这些信息后，我会立即更新代码，替换所有 Mock 数据为真实数据。
