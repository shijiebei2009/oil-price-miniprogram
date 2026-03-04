# 微信云开发部署指南

## 概述

本指南详细说明如何将油价查询小程序部署到微信云开发平台，并配置定时任务自动记录每日油价数据。

## 部署架构

```
┌─────────────────┐
│   小程序前端     │ ← 上传到微信平台
└────────┬────────┘
         │ 云函数调用
         ↓
┌─────────────────┐
│  微信云开发      │ ← 云函数 + 云数据库
│  ┌───────────┐  │
│  │ 定时任务  │  │ ← 每天 00:00 自动执行
│  └───────────┘  │
└─────────────────┘
```

## 部署步骤

### 步骤 1：创建微信云开发环境

1. 打开微信开发者工具
2. 点击"云开发"按钮
3. 选择"开通云开发"
4. 选择"按量付费"或"免费版"
5. 创建环境，记录环境 ID（如 `cloud1-xxx`）

### 步骤 2：配置环境变量

在项目根目录创建 `.env.local` 文件：

```bash
# 微信云开发环境ID
TARO_APP_CLOUD_ENV_ID=cloud1-xxx

# API 密钥（用于云函数调用外部 API）
TIANAPI_KEY=your-tianapi-key
JUHE_API_KEY=your-juhe-api-key
```

### 步骤 3：上传云函数

1. 在微信开发者工具中，打开"云开发"控制台
2. 点击"云函数"标签
3. 点击"新建云函数"
4. 输入云函数名称，如 `daily-price-record`
5. 点击"确定"

6. 复制 `cloud/functions/daily-price-record/` 目录下的所有文件到云函数目录：
   - `index.js`
   - `package.json`
   - `config.json`

7. 在云函数编辑器中，点击"安装依赖"
8. 点击"上传并部署：云端安装依赖"

9. 重复以上步骤，上传其他云函数：
   - `get-oil-price`
   - （可选）`init-database`
   - （可选）`import-history`

### 步骤 4：配置云函数环境变量

1. 在云函数列表中，点击云函数名称（如 `daily-price-record`）
2. 点击"配置"标签
3. 在"环境变量"部分，添加以下变量：

```bash
TIANAPI_KEY=your-tianapi-key
JUHE_API_KEY=your-juhe-api-key
```

### 步骤 5：创建数据库集合

#### 方法 1：通过控制台手动创建

1. 打开"云开发"控制台
2. 点击"数据库"标签
3. 点击"添加集合"
4. 输入集合名称（如 `daily_oil_prices`）
5. 重复以上步骤，创建所有集合：
   - `daily_oil_prices`
   - `oil_price_adjustments`
   - `current_oil_prices`

#### 方法 2：通过云函数自动创建（推荐）

1. 在云函数列表中，点击"init-database"云函数
2. 点击"测试"按钮
3. 点击"调用"
4. 查看返回结果，确认集合创建成功

### 步骤 6：配置数据库权限

1. 在"数据库"标签中，选择集合（如 `daily_oil_prices`）
2. 点击"权限设置"
3. 选择"所有用户可读，仅创建者可写"
4. 点击"保存"
5. 重复以上步骤，为所有集合设置权限

### 步骤 7：配置定时触发器

定时触发器已在 `daily-price-record` 云函数的 `config.json` 中配置：

```json
{
  "triggers": [
    {
      "name": "dailyPriceTimer",
      "type": "timer",
      "config": "0 0 0 * * * *"
    }
  ]
}
```

**配置说明**：
- `0 0 0 * * * *` 表示每天 0 点 0 分 0 秒执行
- 格式：`秒 分 时 日 月 周 年`

如果需要修改执行时间，请修改 `config.json` 中的 `config` 字段。

### 步骤 8：上传小程序代码

1. 在微信开发者工具中，点击"上传"按钮
2. 填写版本号（如 `1.0.0`）和项目备注
3. 点击"上传"
4. 等待上传完成

### 步骤 9：提交审核

1. 登录[微信公众平台](https://mp.weixin.qq.com)
2. 进入"版本管理" -> "开发版本"
3. 点击"提交审核"
4. 填写审核信息
5. 等待审核通过（通常 1-3 个工作日）

### 步骤 10：发布上线

1. 审核通过后，点击"发布"按钮
2. 填写发布说明
3. 点击"确认发布"

## 测试验证

### 测试云函数

1. 在云函数列表中，点击 `daily-price-record` 云函数
2. 点击"测试"按钮
3. 在测试参数中输入：

```json
{
  "Type": "Timer"
}
```

4. 点击"调用"
5. 查看返回结果，确认执行成功

### 测试数据库

1. 在"数据库"标签中，选择 `daily_oil_prices` 集合
2. 点击"查询"按钮
3. 查看是否有数据记录

### 测试小程序

1. 在微信开发者工具中，点击"编译"按钮
2. 查看小程序页面是否正常显示
3. 测试切换城市、查看历史价格等功能

## 常见问题

### 1. 云函数调用失败

**问题**：云函数返回错误

**解决方案**：
- 检查云函数代码是否正确上传
- 检查环境变量是否配置正确
- 查看云函数日志，定位具体错误

### 2. 定时任务不执行

**问题**：每天凌晨没有自动记录价格

**解决方案**：
- 检查 `config.json` 中的触发器配置是否正确
- 检查云函数是否正确上传
- 查看云函数日志，确认是否有定时触发

### 3. 数据库权限错误

**问题**：小程序无法读取数据库

**解决方案**：
- 检查数据库权限设置
- 确保权限设置为"所有用户可读"
- 检查云开发环境 ID 是否正确

### 4. API 调用失败

**问题**：云函数无法调用外部 API

**解决方案**：
- 检查 API 密钥是否正确
- 检查网络是否正常
- 查看云函数日志，确认具体错误

## 监控和维护

### 查看云函数日志

1. 在云函数列表中，点击云函数名称
2. 点击"日志"标签
3. 查看最新的执行日志

### 查看数据库使用情况

1. 在"云开发"控制台，点击"统计"标签
2. 查看"存储使用量"和"读写次数"
3. 确保在免费额度内

### 清理过期数据

建议创建一个定时任务，定期清理过期的每日价格数据：

```javascript
// cloud/functions/cleanup-history/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const daysToKeep = 60 // 保留最近 60 天的数据
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

  const result = await db
    .collection('daily_oil_prices')
    .where({
      date: db.command.lt(cutoffDate.toISOString().split('T')[0])
    })
    .remove()

  return {
    code: 200,
    msg: 'success',
    data: {
      removedCount: result.stats.removed
    }
  }
}
```

配置定时触发器（每周执行一次）：

```json
{
  "triggers": [
    {
      "name": "cleanupTimer",
      "type": "timer",
      "config": "0 0 2 ? * MON" // 每周一凌晨 2 点执行
    }
  ]
}
```

## 成本估算

### 微信云开发免费额度（基础版）

| 资源类型 | 免费额度 |
|---------|---------|
| 数据库存储 | 2 GB |
| 文件存储 | 5 GB |
| CDN 流量 | 5 GB/月 |
| 云函数调用 | 20 万次/月 |
| 云函数运行时 | 4000 GBs/月 |

### 预估使用量（每日）

| 资源类型 | 每日使用量 | 每月使用量 | 是否超出免费额度 |
|---------|-----------|-----------|----------------|
| 数据库存储 | ~1 KB | ~30 KB | ✅ 未超出 |
| 云函数调用 | ~100 次 | ~3000 次 | ✅ 未超出 |
| 云函数运行时 | ~1 GBs | ~30 GBs | ✅ 未超出 |

### 结论

✅ **免费额度足够使用**，无需额外付费。

## 总结

通过以上步骤，你已经成功将油价查询小程序部署到微信云开发平台，并配置了定时任务自动记录每日油价数据。

**主要优势**：
- ✅ 无需购买服务器
- ✅ 自动扩缩容
- ✅ 免费额度充足
- ✅ 与微信生态深度集成
- ✅ 定时任务稳定运行

**下一步**：
- 监控云函数运行状态
- 定期查看数据库使用情况
- 根据需求优化定时任务逻辑
- 收集用户反馈，持续优化功能

## 参考文档

- [微信云开发官方文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
- [云函数定时触发器](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/functions/timer-trigger.html)
- [云数据库](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/database.html)
- [云开发最佳实践](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/best-practice.html)
