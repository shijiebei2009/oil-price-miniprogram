# 微信云开发配置指南

## 一、开通云开发

1. 打开微信开发者工具
2. 点击顶部工具栏「云开发」按钮
3. 点击「开通」
4. 选择免费基础版
5. **环境名称填写：** `oil-price`
6. 开通后会得到环境 ID，格式如 `cloud1-xxxxx`

## 二、配置环境 ID

如果开通的环境 ID 与代码中的不同，需要修改 `src/app.ts`:

```typescript
wx.cloud.init({
  env: '你的环境ID', // 替换为你的云环境ID
  traceUser: true
});
```

## 三、创建数据库集合

在云开发控制台 → 数据库，创建以下集合：

1. `current_oil_prices` - 当前油价数据
2. `daily_oil_prices` - 每日油价历史（可选）
3. `oil_price_adjustments` - 调价历史（用于计算价格变化）

## 四、导入初始数据

### 4.1 导入当前油价数据

在 `current_oil_prices` 集合中导入 `cloud/data/current_oil_prices.json` 文件。

**重要**：微信云开发要求导入格式为 **JSON Lines**（每行一个 JSON 对象，无逗号分隔）。

示例格式：
```json
{"province":"北京市","gas92":7.87,"gas95":8.38,"gas98":9.36,"diesel0":7.59,"updateTime":"2026-01-05"}
{"province":"上海市","gas92":7.83,"gas95":8.33,"gas98":9.23,"diesel0":7.52,"updateTime":"2026-01-05"}
```

### 4.2 导入调价历史数据（重要）

在 `oil_price_adjustments` 集合中导入 `cloud/data/oil_price_adjustments.json` 文件。

这个数据用于计算价格变化，**如果不导入，价格变化将显示为随机模拟值**。

## 五、部署云函数

1. 在微信开发者工具中，展开 `cloud/functions` 目录
2. 右键点击 `get-oil-price` 文件夹
3. 选择「上传并部署：云端安装依赖」
4. 等待部署完成

**注意**：如果右键菜单没有「上传并部署」选项，请检查 `project.config.json` 中是否配置了：
```json
{
  "cloudfunctionRoot": "./cloud/functions"
}
```

## 六、验证云函数

在微信开发者工具中，打开「云开发控制台」→「云函数」→「get-oil-price」→「测试」，输入：

```json
{
  "action": "getProvinceCurrent",
  "province": "北京市"
}
```

如果返回以下格式，说明云函数正常工作：

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "currentPrices": [
      {"name": "92号汽油", "price": 7.87, "previousPrice": 7.82, "change": 0.05},
      ...
    ],
    "nextAdjustment": {...},
    "updateTime": "2026-01-05",
    "cityName": "北京市",
    "provinceName": "北京市"
  }
}
```

## 七、重新编译并上传小程序

```bash
pnpm build:weapp
```

然后在微信开发者工具中上传代码。

---

## 常见问题

### Q: 云开发收费吗？
A: 有免费额度，每月 5GB 流量、2GB 数据库存储、1000 次云函数调用，足够测试使用。

### Q: 数据怎么导入？
A: 云开发控制台 → 数据库 → 选择集合 → 导入 → 选择 JSON 文件（注意必须是 JSON Lines 格式）

### Q: 云函数调用报错怎么办？
A: 检查：
1. 云环境 ID 是否正确
2. 云函数是否部署成功
3. 数据库集合是否创建并导入数据
4. 查看云函数日志排查问题

### Q: 价格变化为什么显示为 0？
A: 请确保导入了 `oil_price_adjustments` 集合的数据。

### Q: 为什么显示"上海市 · 北京市"？
A: 这是数据不匹配导致的，请确保：
1. 前端传入的省份名称与数据库中的 `province` 字段一致
2. 已导入正确的油价数据
