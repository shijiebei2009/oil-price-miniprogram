# 微信云开发数据库集合创建指南

## 数据库集合列表

### 1. daily_oil_prices（每日价格历史）
- **用途**：存储每日的油价记录
- **字段说明**：
  ```json
  {
    "_id": "自动生成的ID",
    "date": "2026-03-04",
    "province": "上海市",
    "gas92": 7.04,
    "gas95": 7.49,
    "gas98": 9.49,
    "diesel0": 6.7,
    "createTime": "2026-03-04T00:00:00.000Z"
  }
  ```

### 2. oil_price_adjustments（调价历史）
- **用途**：存储历次调价记录
- **字段说明**：
  ```json
  {
    "_id": "自动生成的ID",
    "date": "2026-02-25",
    "province": "上海市",
    "gas92": 7.04,
    "gas95": 7.49,
    "gas98": 9.49,
    "diesel0": 6.7,
    "change92": -0.05,
    "change95": -0.05,
    "change98": -0.05,
    "change0": -0.05,
    "createTime": "2026-03-04T00:00:00.000Z"
  }
  ```

### 3. current_oil_prices（当前油价）
- **用途**：存储最新的油价数据
- **字段说明**：
  ```json
  {
    "_id": "自动生成的ID",
    "province": "上海市",
    "gas92": 7.04,
    "gas95": 7.49,
    "gas98": 9.49,
    "diesel0": 6.7,
    "updateTime": "2026-03-04T00:00:00.000Z"
  }
  ```

## 创建步骤

### 方法 1：通过微信云开发控制台手动创建

1. 打开微信开发者工具
2. 点击"云开发"按钮
3. 进入"数据库"标签
4. 点击"添加集合"
5. 输入集合名称（如 `daily_oil_prices`）
6. 重复以上步骤，创建所有集合

### 方法 2：通过云函数自动创建（推荐）

创建一个初始化云函数，自动创建集合和索引：

```javascript
// cloud/functions/init-database/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const collections = [
    'daily_oil_prices',
    'oil_price_adjustments',
    'current_oil_prices'
  ]

  const results = []

  for (const collectionName of collections) {
    try {
      // 尝试插入一条测试数据，自动创建集合
      await db.collection(collectionName).add({
        data: {
          _init: true,
          createTime: new Date().toISOString()
        }
      })

      // 删除测试数据
      const testData = await db.collection(collectionName).where({ _init: true }).get()
      if (testData.data.length > 0) {
        await db.collection(collectionName).doc(testData.data[0]._id).remove()
      }

      results.push({
        collection: collectionName,
        success: true,
        message: '集合创建成功'
      })
    } catch (error) {
      results.push({
        collection: collectionName,
        success: false,
        message: error.message
      })
    }
  }

  return {
    code: 200,
    msg: 'success',
    data: {
      results
    }
  }
}
```

## 创建索引（可选但推荐）

为了提升查询性能，建议创建以下索引：

### daily_oil_prices 索引
```javascript
// 在云开发控制台的"数据库" -> "daily_oil_prices" -> "索引管理"中创建

// 索引 1：按日期查询
{
  "IndexName": "date_1",
  "MgoKeySchema": {
    "MgoIndexKeys": [{
      "Name": "date",
      "Direction": "1"
    }],
    "MgoIsUnique": false
  }
}

// 索引 2：按省份查询
{
  "IndexName": "province_1",
  "MgoKeySchema": {
    "MgoIndexKeys": [{
      "Name": "province",
      "Direction": "1"
    }],
    "MgoIsUnique": false
  }
}
```

### oil_price_adjustments 索引
```javascript
// 索引 1：按日期查询（降序）
{
  "IndexName": "date_-1",
  "MgoKeySchema": {
    "MgoIndexKeys": [{
      "Name": "date",
      "Direction": "-1"
    }],
    "MgoIsUnique": false
  }
}
```

## 数据库权限设置

在微信云开发控制台中，为每个集合设置权限：

### 推荐权限配置

**所有集合**：设置为"所有用户可读，仅创建者可写"

```json
{
  "read": true,
  "write": false
}
```

说明：
- `read: true` - 允许所有用户（包括未登录用户）读取数据
- `write: false` - 禁止前端直接写入，只能通过云函数写入

**高级配置**（如需要用户登录）：

```json
{
  "read": "doc.openid == auth.openid || doc._openid == auth.openid",
  "write": "doc.openid == auth.openid || doc._openid == auth.openid"
}
```

## 初始化数据导入（可选）

如果需要导入历史数据，可以创建一个导入脚本：

```javascript
// cloud/functions/import-history/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  // 历史调价数据
  const historyData = [
    {
      date: '2026-01-05',
      province: '北京市',
      gas92: 7.89,
      gas95: 8.37,
      gas98: 9.13,
      diesel0: 7.56,
      change92: 0.05,
      change95: 0.05,
      change98: 0.05,
      change0: 0.05
    },
    // ... 更多历史数据
  ]

  const results = []

  for (const record of historyData) {
    try {
      await db.collection('oil_price_adjustments').add({
        data: {
          ...record,
          createTime: new Date().toISOString()
        }
      })
      results.push({
        date: record.date,
        province: record.province,
        success: true
      })
    } catch (error) {
      results.push({
        date: record.date,
        province: record.province,
        success: false,
        error: error.message
      })
    }
  }

  return {
    code: 200,
    msg: 'success',
    data: {
      total: historyData.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    }
  }
}
```

## 注意事项

1. **集合创建后不可删除**：微信云开发的集合一旦创建，无法删除，只能清空数据
2. **索引创建需要时间**：创建索引后，需要等待几分钟才能生效
3. **权限设置谨慎**：不要设置为"所有用户可读写"，否则存在安全风险
4. **数据清理**：建议设置定时任务，定期清理过期的每日价格数据（如只保留最近 60 天）

## 验证集合创建

在云开发控制台中，可以执行以下查询验证集合是否正常工作：

```javascript
// 查询 daily_oil_prices 集合
db.collection('daily_oil_prices').get()

// 查询 oil_price_adjustments 集合
db.collection('oil_price_adjustments').orderBy('date', 'desc').limit(10).get()

// 查询 current_oil_prices 集合
db.collection('current_oil_prices').get()
```
