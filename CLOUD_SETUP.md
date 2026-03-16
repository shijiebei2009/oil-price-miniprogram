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
2. `daily_oil_prices` - 每日油价历史
3. `oil_price_adjustments` - 调价历史

## 四、导入初始数据

### 4.1 导入当前油价数据

在 `current_oil_prices` 集合中导入以下数据（JSON 格式）：

```json
[
  {"province":"北京市","gas92":7.49,"gas95":7.94,"gas98":9.44,"diesel0":7.17,"updateTime":"2026-03-09T00:00:00.000Z"},
  {"province":"上海市","gas92":7.60,"gas95":8.05,"gas98":10.05,"diesel0":6.71,"updateTime":"2026-03-09T00:00:00.000Z"},
  {"province":"天津市","gas92":7.48,"gas95":7.88,"gas98":9.38,"diesel0":7.13,"updateTime":"2026-03-09T00:00:00.000Z"},
  {"province":"重庆市","gas92":7.56,"gas95":7.96,"gas98":9.53,"diesel0":7.20,"updateTime":"2026-03-09T00:00:00.000Z"},
  {"province":"河北省","gas92":7.49,"gas95":7.94,"gas98":9.44,"diesel0":7.17,"updateTime":"2026-03-09T00:00:00.000Z"},
  {"province":"山西省","gas92":7.49,"gas95":7.94,"gas98":9.44,"diesel0":7.17,"updateTime":"2026-03-09T00:00:00.000Z"},
  {"province":"内蒙古自治区","gas92":7.49,"gas95":7.94,"gas98":9.44,"diesel0":7.17,"updateTime":"2026-03-09T00:00:00.000Z"},
  {"province":"辽宁省","gas92":7.49,"gas95":7.94,"gas98":9.44,"diesel0":7.17,"updateTime":"2026-03-09T00:00:00.000Z"},
  {"province":"吉林省","gas92":7.49,"gas95":7.94,"gas98":9.44,"diesel0":7.17,"updateTime":"2026-03-09T00:00:00.000Z"},
  {"province":"黑龙江省","gas92":7.49,"gas95":7.94,"gas98":9.44,"diesel0":7.17,"updateTime":"2026-03-09T00:00:00.000Z"},
  {"province":"江苏省","gas92":7.60,"gas95":8.05,"gas98":10.05,"diesel0":6.71,"updateTime":"2026-03-09T00:00:00.000Z"},
  {"province":"浙江省","gas92":7.60,"gas95":8.05,"gas98":10.05,"diesel0":6.71,"updateTime":"2026-03-09T00:00:00.000Z"},
  {"province":"安徽省","gas92":7.60,"gas95":8.05,"gas98":10.05,"diesel0":6.71,"updateTime":"2026-03-09T00:00:00.000Z"},
  {"province":"福建省","gas92":7.60,"gas95":8.05,"gas98":10.05,"diesel0":6.71,"updateTime":"2026-03-09T00:00:00.000Z"},
  {"province":"江西省","gas92":7.60,"gas95":8.05,"gas98":10.05,"diesel0":6.71,"updateTime":"2026-03-09T00:00:00.000Z"},
  {"province":"山东省","gas92":7.49,"gas95":7.94,"gas98":9.44,"diesel0":7.17,"updateTime":"2026-03-09T00:00:00.000Z"},
  {"province":"河南省","gas92":7.49,"gas95":7.94,"gas98":9.44,"diesel0":7.17,"updateTime":"2026-03-09T00:00:00.000Z"},
  {"province":"湖北省","gas92":7.60,"gas95":8.05,"gas98":10.05,"diesel0":6.71,"updateTime":"2026-03-09T00:00:00.000Z"},
  {"province":"湖南省","gas92":7.60,"gas95":8.05,"gas98":10.05,"diesel0":6.71,"updateTime":"2026-03-09T00:00:00.000Z"},
  {"province":"广东省","gas92":7.60,"gas95":8.05,"gas98":10.05,"diesel0":6.71,"updateTime":"2026-03-09T00:00:00.000Z"},
  {"province":"广西壮族自治区","gas92":7.60,"gas95":8.05,"gas98":10.05,"diesel0":6.71,"updateTime":"2026-03-09T00:00:00.000Z"},
  {"province":"海南省","gas92":7.60,"gas95":8.05,"gas98":10.05,"diesel0":6.71,"updateTime":"2026-03-09T00:00:00.000Z"},
  {"province":"四川省","gas92":7.60,"gas95":8.05,"gas98":10.05,"diesel0":6.71,"updateTime":"2026-03-09T00:00:00.000Z"},
  {"province":"贵州省","gas92":7.60,"gas95":8.05,"gas98":10.05,"diesel0":6.71,"updateTime":"2026-03-09T00:00:00.000Z"},
  {"province":"云南省","gas92":7.60,"gas95":8.05,"gas98":10.05,"diesel0":6.71,"updateTime":"2026-03-09T00:00:00.000Z"},
  {"province":"西藏自治区","gas92":7.60,"gas95":8.05,"gas98":10.05,"diesel0":6.71,"updateTime":"2026-03-09T00:00:00.000Z"},
  {"province":"陕西省","gas92":7.49,"gas95":7.94,"gas98":9.44,"diesel0":7.17,"updateTime":"2026-03-09T00:00:00.000Z"},
  {"province":"甘肃省","gas92":7.49,"gas95":7.94,"gas98":9.44,"diesel0":7.17,"updateTime":"2026-03-09T00:00:00.000Z"},
  {"province":"青海省","gas92":7.49,"gas95":7.94,"gas98":9.44,"diesel0":7.17,"updateTime":"2026-03-09T00:00:00.000Z"},
  {"province":"宁夏回族自治区","gas92":7.49,"gas95":7.94,"gas98":9.44,"diesel0":7.17,"updateTime":"2026-03-09T00:00:00.000Z"},
  {"province":"新疆维吾尔自治区","gas92":7.49,"gas95":7.94,"gas98":9.44,"diesel0":7.17,"updateTime":"2026-03-09T00:00:00.000Z"},
  {"province":"台湾省","gas92":7.60,"gas95":8.05,"gas98":10.05,"diesel0":6.71,"updateTime":"2026-03-09T00:00:00.000Z"},
  {"province":"香港特别行政区","gas92":7.60,"gas95":8.05,"gas98":10.05,"diesel0":6.71,"updateTime":"2026-03-09T00:00:00.000Z"},
  {"province":"澳门特别行政区","gas92":7.60,"gas95":8.05,"gas98":10.05,"diesel0":6.71,"updateTime":"2026-03-09T00:00:00.000Z"}
]
```

### 4.2 导入调价历史数据

在 `oil_price_adjustments` 集合中导入：

```json
[
  {"date":"2026-01-06","province":"北京市","gas92":6.87,"gas95":7.32,"gas98":8.82,"diesel0":6.55},
  {"date":"2026-01-20","province":"北京市","gas92":6.87,"gas95":7.34,"gas98":9.32,"diesel0":6.55},
  {"date":"2026-02-03","province":"北京市","gas92":6.93,"gas95":7.41,"gas98":8.95,"diesel0":6.59},
  {"date":"2026-02-24","province":"北京市","gas92":7.48,"gas95":7.93,"gas98":9.43,"diesel0":7.16},
  {"date":"2026-03-09","province":"北京市","gas92":7.49,"gas95":7.94,"gas98":9.44,"diesel0":7.17}
]
```

## 五、部署云函数

1. 在微信开发者工具中，展开 `cloud/functions` 目录
2. 右键点击 `get-oil-price` 文件夹
3. 选择「上传并部署：云端安装依赖」
4. 等待部署完成

## 六、修改代码启用云开发

确认 `src/utils/cloud.ts` 中的 `isCloudEnv()` 函数：

```typescript
import Taro from '@tarojs/taro'

export const isCloudEnv = () => {
  return Taro.getEnv() === Taro.ENV_TYPE.WEAPP && typeof wx !== 'undefined' && wx.cloud
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
A: 云开发控制台 → 数据库 → 选择集合 → 导入 → 选择 JSON 文件

### Q: 云函数调用报错怎么办？
A: 检查：
1. 云环境 ID 是否正确
2. 云函数是否部署成功
3. 数据库集合是否创建并导入数据
