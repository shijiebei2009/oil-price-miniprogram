# 汽油柴油价格查询小程序 - 设计指南 V2

## 品牌定位

**应用定位**：专业、实用的油价查询与预警工具
**设计风格**：简洁、现代、数据导向、卡片化设计
**目标用户**：车主、物流从业者、关注油价的人群

## 配色方案

### 主色调
- **主色**：`bg-blue-600` / `text-blue-600`（专业、可信赖）
- **主色浅色**：`bg-blue-50` / `text-blue-700`（辅助展示）
- **主色渐变**：`bg-gradient-to-r from-blue-500 to-blue-600`（标题栏、按钮）

### 语义色
- **价格上涨**：`bg-red-500` / `text-red-500` / `bg-red-50`（警示）
- **价格下降**：`bg-green-500` / `text-green-500` / `bg-green-50`（利好）
- **中性/关注**：`bg-yellow-500` / `text-yellow-500` / `bg-yellow-50`
- **价格稳定**：`bg-gray-500` / `text-gray-500` / `bg-gray-100`

### 中性色
- **主文本**：`text-gray-900`
- **次要文本**：`text-gray-600`
- **辅助文本**：`text-gray-400`
- **边框**：`border-gray-200`
- **背景**：`bg-gray-50` / `bg-white`
- **分割线**：`border-gray-100`

## 字体规范

### 标题层级
- **H1（页面标题）**：`text-xl font-bold`（主要标题，适应小程序）
- **H2（卡片标题）**：`text-lg font-semibold`（卡片标题）
- **H3（小标题）**：`text-base font-semibold`（区块标题）
- **Body（正文）**：`text-sm font-normal`（正文内容）
- **Caption（说明）**：`text-xs text-gray-500`（辅助说明）

### 特殊字体
- **价格数字**：`text-3xl font-bold text-gray-900`
- **涨跌幅**：`text-base font-semibold`（红涨绿跌）
- **日期**：`text-xs text-gray-400`

## 间距系统

### 页面边距
- **屏幕边距**：`p-3`（12px，小程序适配）
- **卡片内边距**：`p-4`（16px）
- **小间距**：`gap-2`（8px）
- **中间距**：`gap-3`（12px）
- **大间距**：`gap-4`（16px）

### 垂直间距
- **页面顶部**：`pt-2`
- **卡片间距**：`mb-3`
- **元素间距**：`my-2`

## 页面结构

### 1. 首页（价格查询）

#### 顶部区域
```tsx
// 城市选择器 + 标题
<View className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3">
  <View className="flex flex-row items-center justify-between">
    <View className="flex-1">
      <Text className="block text-lg font-bold text-white">油价查询</Text>
      <Text className="block text-xs text-blue-100 mt-1">
        {updateTime}
      </Text>
    </View>
    <View className="flex items-center bg-white/20 rounded-full px-3 py-1">
      <Text className="text-sm text-white">{currentCity}</Text>
      <Text className="text-white ml-1">▼</Text>
    </View>
  </View>
</View>
```

#### 当前油价卡片
```tsx
// 价格卡片（圆角、阴影、底部边距）
<View className="bg-white rounded-2xl p-4 shadow-sm mb-3">
  <Text className="block text-lg font-semibold mb-4">当前油价</Text>

  {oilTypes.map((item, index) => (
    <View
      key={index}
      className="bg-gray-50 rounded-xl p-4 mb-3 flex flex-row items-center justify-between"
    >
      <View className="flex-1">
        <Text className="block text-sm font-semibold text-gray-900 mb-1">
          {item.name}
        </Text>
        <Text className="block text-xs text-gray-500">元/升</Text>
      </View>
      <View className="text-right">
        <Text className="block text-3xl font-bold text-gray-900">
          {item.price.toFixed(2)}
        </Text>
        <Text className={`block text-sm ${getChangeColor(item.change)}`}>
          {getChangeDisplay(item.change)}
        </Text>
      </View>
    </View>
  ))}
</View>
```

#### 调价预警卡片
```tsx
// 调价预警
<View className="bg-white rounded-2xl p-4 shadow-sm mb-3">
  <View className="flex flex-row items-center justify-between mb-4">
    <Text className="block text-lg font-semibold">下次调价</Text>
    <View className="flex items-center gap-2">
      <View className="w-2 h-2 rounded-full bg-red-500"></View>
      <Text className="text-xs text-gray-500">距离调价还有 {daysRemaining} 天</Text>
    </View>
  </View>

  <View className="flex flex-row items-center justify-between bg-gray-50 rounded-xl p-4">
    <View>
      <Text className="block text-xs text-gray-500 mb-1">预计日期</Text>
      <Text className="block text-base font-semibold text-gray-900">
        {nextAdjustment.date}
      </Text>
    </View>
    <View
      className={`px-4 py-2 rounded-full ${getAdjustmentDirection(nextAdjustment.direction).bg}`}
    >
      <Text
        className={`text-sm font-semibold ${getAdjustmentDirection(nextAdjustment.direction).color}`}
      >
        {getAdjustmentDirection(nextAdjustment.direction).text}
      </Text>
    </View>
  </View>
</View>
```

#### 快捷功能入口
```tsx
// 功能入口网格
<View className="bg-white rounded-2xl p-4 shadow-sm">
  <View className="grid grid-cols-2 gap-3">
    <View className="bg-blue-50 rounded-xl p-4 flex flex-col items-center">
      <Text className="text-2xl mb-2">📈</Text>
      <Text className="text-sm font-semibold text-gray-900">历史价格</Text>
      <Text className="text-xs text-gray-500 mt-1">查看走势</Text>
    </View>
    <View className="bg-green-50 rounded-xl p-4 flex flex-col items-center">
      <Text className="text-2xl mb-2">🔔</Text>
      <Text className="text-sm font-semibold text-gray-900">调价提醒</Text>
      <Text className="text-xs text-gray-500 mt-1">开启通知</Text>
    </View>
    <View className="bg-purple-50 rounded-xl p-4 flex flex-col items-center">
      <Text className="text-2xl mb-2">🌍</Text>
      <Text className="text-sm font-semibold text-gray-900">多城市对比</Text>
      <Text className="text-xs text-gray-500 mt-1">查看差异</Text>
    </View>
    <View className="bg-orange-50 rounded-xl p-4 flex flex-col items-center">
      <Text className="text-2xl mb-2">💡</Text>
      <Text className="text-sm font-semibold text-gray-900">加油建议</Text>
      <Text className="text-xs text-gray-500 mt-1">省钱攻略</Text>
    </View>
  </View>
</View>
```

### 2. 历史价格页面

#### 页面标题
```tsx
<View className="bg-white px-4 py-3 border-b border-gray-100">
  <Text className="block text-lg font-bold text-gray-900">历史价格</Text>
</View>
```

#### 时间筛选器
```tsx
<View className="bg-white px-4 py-3">
  <View className="flex flex-row gap-2">
    <View className="flex-1 bg-blue-600 rounded-full px-4 py-2">
      <Text className="text-sm text-white text-center">近7天</Text>
    </View>
    <View className="flex-1 bg-gray-100 rounded-full px-4 py-2">
      <Text className="text-sm text-gray-600 text-center">近30天</Text>
    </View>
    <View className="flex-1 bg-gray-100 rounded-full px-4 py-2">
      <Text className="text-sm text-gray-600 text-center">近90天</Text>
    </View>
    <View className="flex-1 bg-gray-100 rounded-full px-4 py-2">
      <Text className="text-sm text-gray-600 text-center">全部</Text>
    </View>
  </View>
</View>
```

#### 走势图区域（使用 Canvas 或第三方图表库）
```tsx
<View className="bg-white px-4 py-4">
  <Text className="block text-base font-semibold mb-3">价格走势</Text>
  <View className="h-48 bg-gray-50 rounded-xl flex items-center justify-center">
    <Text className="text-sm text-gray-500">走势图区域</Text>
  </View>
</View>
```

#### 历史价格列表
```tsx
<View className="px-4 py-3">
  <Text className="block text-base font-semibold mb-3">价格记录</Text>

  {historyData.map((item, index) => (
    <View
      key={index}
      className="bg-white rounded-xl p-4 mb-2 shadow-sm"
    >
      <View className="flex flex-row items-center justify-between mb-2">
        <Text className="block text-sm font-semibold text-gray-900">
          {item.date}
        </Text>
        <Text
          className={`text-sm font-semibold ${getChangeColor(item.change)}`}
        >
          {getChangeDisplay(item.change)}
        </Text>
      </View>
      <View className="flex flex-row gap-4">
        <View className="flex-1">
          <Text className="block text-xs text-gray-500 mb-1">92号</Text>
          <Text className="block text-sm font-semibold text-gray-900">
            {item.gas92}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="block text-xs text-gray-500 mb-1">95号</Text>
          <Text className="block text-sm font-semibold text-gray-900">
            {item.gas95}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="block text-xs text-gray-500 mb-1">0号柴油</Text>
          <Text className="block text-sm font-semibold text-gray-900">
            {item.diesel0}
          </Text>
        </View>
      </View>
    </View>
  ))}
</View>
```

### 3. 多城市对比页面

#### 城市列表
```tsx
<View className="px-4 py-3">
  <Text className="block text-base font-semibold mb-3">城市对比</Text>

  {cities.map((city, index) => (
    <View
      key={index}
      className="bg-white rounded-xl p-4 mb-2 shadow-sm"
    >
      <View className="flex flex-row items-center justify-between mb-3">
        <Text className="block text-base font-semibold text-gray-900">
          {city.name}
        </Text>
        {city.diff !== 0 && (
          <Text
            className={`text-sm font-semibold ${getChangeColor(city.diff)}`}
          >
            {city.diff > 0 ? '+' : ''}{city.diff.toFixed(2)}
          </Text>
        )}
      </View>
      <View className="flex flex-row gap-4">
        <View className="flex-1 bg-gray-50 rounded-lg p-3">
          <Text className="block text-xs text-gray-500 mb-1">92号</Text>
          <Text className="block text-base font-bold text-gray-900">
            {city.gas92}
          </Text>
        </View>
        <View className="flex-1 bg-gray-50 rounded-lg p-3">
          <Text className="block text-xs text-gray-500 mb-1">95号</Text>
          <Text className="block text-base font-bold text-gray-900">
            {city.gas95}
          </Text>
        </View>
        <View className="flex-1 bg-gray-50 rounded-lg p-3">
          <Text className="block text-xs text-gray-500 mb-1">0号柴油</Text>
          <Text className="block text-base font-bold text-gray-900">
            {city.diesel0}
          </Text>
        </View>
      </View>
    </View>
  ))}
</View>
```

## 导航结构

### TabBar 配置（可选）
```typescript
export default defineAppConfig({
  tabBar: {
    color: '#999999',
    selectedColor: '#1890ff',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页'
      },
      {
        pagePath: 'pages/history/index',
        text: '历史'
      },
      {
        pagePath: 'pages/city/index',
        text: '城市'
      },
      {
        pagePath: 'pages/notice/index',
        text: '提醒'
      }
    ]
  }
})
```

## 数据展示规范

### 价格展示
- 使用两位小数：`7.89`
- 单位清晰标注：`元/升`
- 价格更新时间：`2024-01-10 00:00`（右对齐，灰色小字）

### 调价信息
- 调价日期：`YYYY-MM-DD` 格式
- 调价方向：图标 + 文字（↑ 预计上涨 / ↓ 预计下降）
- 预测幅度：`+0.15` / `-0.10`（红涨绿跌）
- 倒计时：`距离调价还有 5 天`

### 历史价格
- 日期：`MM-DD` 格式（如：01-10）
- 涨跌幅：显示与上次相比的涨跌
- 列表展示：最近的价格记录

## 跨端兼容性

### Text 组件
- 所有需要换行的 Text 必须添加 `block` 类
- 平台检测：`const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP`

### 网络请求
- 使用 `Network.request()` 发起请求
- URL 必须使用相对路径：`/api/oil-price/current`
- 禁止硬编码 localhost

### 响应数据解析
- 统一响应格式：`{ code: number, msg: string, data: any }`
- 使用可选链：`res.data?.data`
- 先打印后访问：`console.log(res.data)`

## 性能优化

- 使用 Tailwind 原子化类，避免自定义 CSS
- 避免频繁更新状态，合并状态更新
- 合理使用 `useLoad` 和 `useDidShow`
- 首屏数据预加载
- 列表使用虚拟滚动（如数据量大）

## 小程序约束

### 包体积
- 图片资源使用在线 CDN 或 emoji
- 避免引入大型第三方库
- 代码分包（如有必要）

### 图片策略
- 使用 emoji 代替图片图标
- 避免使用大尺寸图片
- 图片压缩优化

### 网络请求
- 合理设置请求超时时间
- 错误处理和重试机制
- 缓存策略（油价数据可缓存 1 小时）

## 新增功能设计

### 1. 推送通知
- **开关位置**：设置页面或首页功能入口
- **触发条件**：调价当天、价格变动超过阈值
- **通知内容**：调价日期、调价方向、预计幅度

### 2. 多城市切换
- **切换方式**：顶部下拉选择器或城市列表页面
- **热门城市**：北京、上海、广州、深圳、杭州等
- **城市差异**：与当前城市对比，显示价格差异

### 3. 历史价格走势图
- **图表类型**：折线图（支持多油种）
- **时间范围**：近7天、近30天、近90天、全部
- **交互功能**：点击查看具体日期价格

## 组件规范

### 状态标签
```tsx
// 价格上涨
<View className="px-3 py-1 rounded-full bg-red-50">
  <Text className="text-red-500 text-sm font-semibold">预计上涨</Text>
</View>

// 价格下降
<View className="px-3 py-1 rounded-full bg-green-50">
  <Text className="text-green-500 text-sm font-semibold">预计下降</Text>
</View>

// 价格稳定
<View className="px-3 py-1 rounded-full bg-gray-50">
  <Text className="text-gray-500 text-sm font-semibold">预计稳定</Text>
</View>
```

### 加载状态
```tsx
<View className="flex items-center justify-center py-12">
  <Text className="text-sm text-gray-500">加载中...</Text>
</View>
```

### 空状态
```tsx
<View className="flex flex-col items-center justify-center py-12">
  <Text className="text-3xl mb-3">📭</Text>
  <Text className="text-base text-gray-500 text-center">暂无数据</Text>
  <Text className="text-sm text-gray-400 text-center mt-2">请稍后再试</Text>
</View>
```

### 错误状态
```tsx
<View className="flex flex-col items-center justify-center py-12">
  <Text className="text-3xl mb-3">⚠️</Text>
  <Text className="text-base text-gray-500 text-center">加载失败</Text>
  <View className="mt-4 px-6 py-2 bg-blue-600 rounded-full">
    <Text className="text-sm text-white">重新加载</Text>
  </View>
</View>
```
