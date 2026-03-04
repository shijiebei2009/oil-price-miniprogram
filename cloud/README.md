# 微信云开发定时任务实现说明

## 概述

本项目已实现微信云开发部署方式下的定时任务逻辑，使用云函数定时触发器自动记录每日油价数据。

## 文件结构

```
cloud/
├── functions/
│   ├── daily-price-record/      # 定时任务云函数（每天 00:00 执行）
│   │   ├── index.js              # 云函数主逻辑
│   │   ├── package.json          # 依赖配置
│   │   └── config.json           # 定时触发器配置
│   └── get-oil-price/            # 油价查询云函数（供小程序前端调用）
│       ├── index.js              # 云函数主逻辑
│       └── package.json          # 依赖配置
├── README_DATABASE.md            # 数据库集合创建指南
└── README_DEPLOY.md              # 部署配置说明文档
```

## 云函数说明

### 1. daily-price-record（定时任务）

**功能**：每天 00:00 自动记录油价数据

**触发方式**：定时触发器（每天 00:00:00）

**主要逻辑**：
1. 从 API 获取最新油价数据（优先级：聚合数据 > 天聚数行）
2. 记录每日价格到 `daily_oil_prices` 集合
3. 检查今天是否是调价日期
4. 如果是调价日期，记录调价历史到 `oil_price_adjustments` 集合

**配置文件**：`config.json`
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

**环境变量**：
- `TIANAPI_KEY`：天聚数行 API 密钥
- `JUHE_API_KEY`：聚合数据 API 密钥

### 2. get-oil-price（油价查询）

**功能**：供小程序前端调用，获取油价数据

**触发方式**：小程序前端调用

**支持的操作**：
- `getCurrent`：获取当前油价（支持城市参数）
- `getProvinceCurrent`：获取当前油价（支持省份参数）
- `getCityList`：获取城市列表
- `getProvinceList`：获取省份列表
- `getAllCityPrices`：获取所有城市价格对比
- `getAllProvincePrices`：获取所有省份价格对比
- `getHistory`：获取历史价格（按调价次数查询）
- `getDailyHistory`：获取每日价格历史（按天数查询）

## 数据库集合

### 1. daily_oil_prices（每日价格历史）

**字段说明**：
- `date`：日期（格式：YYYY-MM-DD）
- `province`：省份名称
- `gas92`：92 号汽油价格
- `gas95`：95 号汽油价格
- `gas98`：98 号汽油价格
- `diesel0`：0 号柴油价格
- `createTime`：记录创建时间

**索引**：
- `date`（升序）：按日期查询
- `province`（升序）：按省份查询

### 2. oil_price_adjustments（调价历史）

**字段说明**：
- `date`：调价日期（格式：YYYY-MM-DD）
- `province`：省份名称
- `gas92`：92 号汽油价格
- `gas95`：95 号汽油价格
- `gas98`：98 号汽油价格
- `diesel0`：0 号柴油价格
- `change92`：92 号汽油价格变化
- `change95`：95 号汽油价格变化
- `change98`：98 号汽油价格变化
- `change0`：0 号柴油价格变化
- `createTime`：记录创建时间

**索引**：
- `date`（降序）：按日期查询

### 3. current_oil_prices（当前油价）

**字段说明**：
- `province`：省份名称
- `gas92`：92 号汽油价格
- `gas95`：95 号汽油价格
- `gas98`：98 号汽油价格
- `diesel0`：0 号柴油价格
- `updateTime`：更新时间

**用途**：
- 存储最新的油价数据
- 供小程序前端快速查询

## 小程序端适配

### 1. 云开发初始化

在 `src/app.ts` 中已添加云开发环境初始化：

```typescript
// 检测是否为微信小程序环境
const isWeapp = typeof wx !== 'undefined' && wx.cloud;

export default ({ children }: PropsWithChildren<any>) => {
  useLaunch(() => {
    // 初始化云开发环境（仅在微信小程序环境）
    if (isWeapp) {
      wx.cloud.init({
        env: process.env.TARO_APP_CLOUD_ENV_ID || undefined,
        traceUser: true
      });
    }
  });

  return children;
};
```

### 2. 云函数调用封装

在 `src/utils/cloud.ts` 中已创建云函数调用封装：

```typescript
// 检测是否在云开发环境
export const isCloudEnv = () => {
  return typeof wx !== 'undefined' && wx.cloud
}

// 云函数调用
export const callCloudFunction = async (name: string, data: any) => {
  if (!isCloudEnv()) {
    throw new Error('云开发环境未初始化')
  }

  const result = await wx.cloud.callFunction({
    name,
    data
  })

  return result.result
}

// 获取油价数据
export const getCurrentPrice = async (province?: string) => {
  return callCloudFunction('get-oil-price', {
    action: 'getProvinceCurrent',
    province
  })
}
```

### 3. 自动适配调用方式

在 `src/pages/index/index.tsx` 中已修改为自动适配调用方式：

```typescript
// 根据环境选择调用方式
if (isCloudEnv()) {
  console.log('使用云函数调用')
  res = await getCloudCurrentPrice(province)
} else {
  console.log('使用 API 调用')
  res = await Network.request({
    url: `/api/oil-price/province/current?province=${encodeURIComponent(province)}`,
    method: 'GET'
  })
}
```

## 部署步骤

### 快速开始

1. 创建微信云开发环境
2. 上传云函数（`daily-price-record` 和 `get-oil-price`）
3. 配置云函数环境变量（API 密钥）
4. 创建数据库集合（`daily_oil_prices`、`oil_price_adjustments`、`current_oil_prices`）
5. 配置数据库权限（所有用户可读，仅创建者可写）
6. 上传小程序代码
7. 提交审核并发布

### 详细步骤

请参考 `cloud/README_DEPLOY.md` 获取详细的部署指南。

## 环境变量配置

在项目根目录创建 `.env.local` 文件：

```bash
# 微信云开发环境ID
TARO_APP_CLOUD_ENV_ID=cloud1-xxx

# API 密钥（用于云函数调用外部 API）
TIANAPI_KEY=your-tianapi-key
JUHE_API_KEY=your-juhe-api-key
```

## 注意事项

### 1. 云函数权限

- 云函数默认拥有数据库的读写权限
- 小程序前端只能读取数据库，不能直接写入（通过云函数写入）
- 建议设置数据库权限为"所有用户可读，仅创建者可写"

### 2. 定时触发器限制

- 定时触发器最小间隔为 1 分钟
- 每个云函数最多配置 5 个定时触发器
- 定时触发器的配置需要上传云函数后才能生效

### 3. API 调用限制

- 聚合数据 API：免费版每天 100 次调用
- 天聚数行 API：免费版每天 100 次调用
- 建议配置两个 API 密钥，实现容错切换

### 4. 数据库存储限制

- 微信云开发免费版提供 2 GB 数据库存储
- 每日价格数据约 1 KB，60 天数据约 60 KB
- 远低于免费额度，无需担心存储空间

### 5. 云函数运行时限制

- 云函数免费版提供 4000 GBs/月 运行时
- 每次定时任务约 10-30 秒，每月约 900-2700 秒
- 远低于免费额度，无需担心运行时

## 监控和维护

### 查看云函数日志

1. 在云开发控制台，选择云函数
2. 点击"日志"标签
3. 查看最新的执行日志

### 查看数据库使用情况

1. 在云开发控制台，点击"统计"标签
2. 查看"存储使用量"和"读写次数"

### 清理过期数据

建议创建一个定时任务，定期清理过期的每日价格数据（参考 `cloud/README_DEPLOY.md` 中的示例）。

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

## 对比：云开发 vs 独立服务器

| 特性 | 微信云开发 | 独立服务器（NestJS） |
|------|-----------|-------------------|
| 部署复杂度 | 简单 | 中等 |
| 成本 | 免费（免费额度充足） | 50-100元/月 |
| 定时任务 | 云函数定时触发器 | Node.js setInterval |
| 数据库 | 云数据库（MongoDB） | PostgreSQL / MySQL |
| 扩展性 | 自动扩缩容 | 手动扩容 |
| 维护成本 | 低 | 中等 |
| 与微信集成 | 深度集成 | 需要额外配置 |

## 总结

微信云开发部署方式适合以下场景：

✅ 快速上线项目
✅ 预算有限（免费额度充足）
✅ 不需要复杂的后端逻辑
✅ 与微信生态深度集成

如果需要复杂的后端逻辑或完全控制服务器，建议选择独立服务器部署方式。

## 参考文档

- [微信云开发官方文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
- [云函数定时触发器](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/functions/timer-trigger.html)
- [云数据库](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/database.html)
- [云开发最佳实践](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/best-practice.html)
