# 汽油柴油价格查询小程序 - 设计指南

## 品牌定位

**应用定位**：专业、实用的油价查询工具
**设计风格**：简洁、现代、数据导向
**目标用户**：车主、物流从业者、关注油价的人群

## 配色方案

### 主色调
- 主色：`bg-blue-600` / `text-blue-600`（专业、可信赖）
- 主色浅色：`bg-blue-50` / `text-blue-700`（辅助展示）

### 语义色
- 价格上涨：`bg-red-500` / `text-red-500`（警示）
- 价格下降：`bg-green-500` / `text-green-500`（利好）
- 中性/关注：`bg-yellow-500` / `text-yellow-500`
- 价格稳定：`bg-gray-500` / `text-gray-500`

### 中性色
- 主文本：`text-gray-900`
- 次要文本：`text-gray-600`
- 辅助文本：`text-gray-400`
- 边框：`border-gray-200`
- 背景：`bg-gray-50` / `bg-white`

## 字体规范

### 标题层级
- **H1（页面标题）**：`text-2xl font-bold`（主要标题）
- **H2（卡片标题）**：`text-lg font-semibold`（卡片标题）
- **H3（小标题）**：`text-base font-semibold`（区块标题）
- **Body（正文）**：`text-base font-normal`（正文内容）
- **Caption（说明）**：`text-sm font-normal text-gray-500`（辅助说明）

### 特殊字体
- 价格数字：`text-2xl font-bold text-gray-900`
- 涨跌幅：`text-lg font-semibold`（红涨绿跌）
- 日期：`text-sm text-gray-500`

## 间距系统

### 页面边距
- 屏幕边距：`p-4`（16px）
- 卡片内边距：`p-4`（16px）
- 小间距：`gap-2`（8px）
- 中间距：`gap-4`（16px）
- 大间距：`gap-6`（24px）

### 垂直间距
- 页面顶部：`pt-4`
- 卡片间距：`mb-4`
- 元素间距：`my-2`

## 组件规范

### 价格卡片
```tsx
// 当前油价卡片
<View className="bg-white rounded-xl p-4 shadow-sm mb-4">
  <Text className="block text-lg font-semibold mb-3">当前油价</Text>
  <View className="flex flex-row items-center gap-4">
    <View className="flex-1">
      <Text className="block text-sm text-gray-500 mb-1">92号汽油</Text>
      <Text className="block text-2xl font-bold text-gray-900">7.89</Text>
      <Text className="block text-sm text-gray-400">元/升</Text>
    </View>
  </View>
</View>

// 调价预警卡片
<View className="bg-white rounded-xl p-4 shadow-sm">
  <Text className="block text-lg font-semibold mb-3">下次调价</Text>
  <View className="flex flex-row items-center justify-between">
    <View>
      <Text className="block text-sm text-gray-500 mb-1">预计日期</Text>
      <Text className="block text-base font-semibold text-gray-900">2024-01-15</Text>
    </View>
    <View className="px-3 py-1 rounded-full bg-red-50">
      <Text className="text-red-500 text-sm font-semibold">预计上涨</Text>
    </View>
  </View>
</View>
```

### 价格列表项
```tsx
<View className="bg-white rounded-lg p-4 mb-2 flex flex-row items-center justify-between">
  <View className="flex-1">
    <Text className="block text-base font-semibold text-gray-900 mb-1">92号汽油</Text>
    <Text className="block text-sm text-gray-500">元/升</Text>
  </View>
  <View className="text-right">
    <Text className="block text-2xl font-bold text-gray-900">7.89</Text>
    <Text className="block text-sm text-red-500">↑ 0.15</Text>
  </View>
</View>
```

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
<View className="flex items-center justify-center py-8">
  <Text className="text-sm text-gray-500">加载中...</Text>
</View>
```

### 空状态
```tsx
<View className="flex flex-col items-center justify-center py-12">
  <Text className="text-base text-gray-500 text-center">暂无数据</Text>
  <Text className="text-sm text-gray-400 text-center mt-2">请稍后再试</Text>
</View>
```

## 导航结构

### 页面配置
- **首页**：油价查询主页（价格展示、调价预警）
- 页面标题："油价查询"

### 无需 TabBar
本项目为单页面应用，无需配置 TabBar。

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

## 小程序约束

### 包体积
- 图片资源使用在线 CDN
- 避免引入大型第三方库
- 代码分包（如有必要）

### 图片策略
- 使用 SVG 图标或 lucide-react 图标库
- 避免使用大尺寸图片
- 图片压缩优化

### 网络请求
- 合理设置请求超时时间
- 错误处理和重试机制
- 缓存策略（油价数据可缓存 1 小时）
