# ECharts 正确使用方式 - 最终修复

## 错误信息

```
TypeError: o.miniprogram_distExports.init is not a function. (In 'o.miniprogram_distExports.init(e,null,{width:t,height:s,devicePixelRatio:1})', 'o.miniprogram_distExports.init' is undefined)
```

## 根本原因

### 误解 echarts-for-weixin

**之前的错误理解**：
```typescript
// ❌ 错误：认为 echarts-for-weixin 是一个 echarts 库
import * as echarts from 'echarts-for-weixin'
const chart = echarts.init(canvas, ...)
```

**实际情况**：
- `echarts-for-weixin` 是一个微信小程序组件（ec-canvas），不是一个 echarts 库
- 它不包含 `echarts.init` 方法
- 它期望从外部接收 echarts 实例

### 正确的使用方式

**根据 echarts-for-weixin 官方文档**：

```javascript
// 1. 从 npm 引入标准的 echarts 包
import * as echarts from 'echarts'

// 2. 将 echarts 实例传递给 ec-canvas 组件
<ec-canvas
  id="mychart-dom-bar"
  canvas-id="mychart-bar"
  echarts="{{ echarts }}"
  ec="{{ ec }}"
/>

// 3. 在 onInit 回调中使用传入的 echarts 实例
function initChart(canvas, width, height, echartsLib) {
  const chart = echartsLib.init(canvas, null, {
    width: width,
    height: height,
    devicePixelRatio: 1
  })
  // ...
}
```

## 修复内容

### 1. 修改 WxChart 组件

**src/components/WxChart/index.tsx**

```typescript
// 修改前
import * as echarts from 'echarts-for-weixin'

const initChart = (canvas: any, width: number, heightValue: number) => {
  const chart = echarts.init(canvas, ...)  // ❌ 错误：echarts 没有 init 方法
}

// 修改后
import * as echarts from 'echarts'  // 使用标准 echarts 包

const initChart = (canvas: any, width: number, heightValue: number, echartsLib: any) => {
  if (!echartsLib) {
    console.error('WxChart: echarts 库未传入，无法初始化图表')
    return null
  }
  const chart = echartsLib.init(canvas, ...)  // ✅ 正确：使用传入的 echarts 实例
}
```

**将 echarts 实例传递给 ec-canvas 组件**：

```typescript
// 修改前
<ec-canvas
  id={canvasId}
  canvas-id={canvasId}
  ec={{ onInit: initChart, lazyLoad: false }}
/>

// 修改后
<ec-canvas
  id={canvasId}
  canvas-id={canvasId}
  ec={{ onInit: initChart, lazyLoad: false }}
  echarts={echarts}  // 传递 echarts 实例
/>
```

### 2. 修改 ec-canvas 组件

**src/components/ec-canvas/index.js**

**添加 echarts 属性**：

```javascript
// 修改前
properties: {
  canvasId: { type: String, value: 'ec-canvas' },
  ec: { type: Object },
  forceUseOldCanvas: { type: Boolean, value: false }
}

// 修改后
properties: {
  canvasId: { type: String, value: 'ec-canvas' },
  ec: { type: Object },
  echarts: { type: Object },  // 添加 echarts 属性
  forceUseOldCanvas: { type: Boolean, value: false }
}
```

**将 echarts 实例传递给 onInit 回调**：

```javascript
// 修改前
if (this.data.ec.onInit) {
  this.data.ec.onInit(ctx, canvasWidth, canvasHeight)
}

// 修改后
if (this.data.ec.onInit) {
  // 将 echarts 实例作为第四个参数传递
  this.data.ec.onInit(ctx, canvasWidth, canvasHeight, this.data.echarts)
}
```

## 关键点

### echarts vs echarts-for-weixin

| 包名 | 类型 | 用途 | 是否包含 echarts.init |
|------|------|------|----------------------|
| `echarts` | npm 包 | 标准 ECharts 库 | ✅ 是 |
| `echarts-for-weixin` | 小程序组件 | ec-canvas 组件 | ❌ 否 |

### 数据流

```
标准 echarts 包
    ↓
WxChart 组件 (import echarts)
    ↓
ec-canvas 组件 (echarts 属性)
    ↓
onInit 回调 (第四个参数)
    ↓
echartsLib.init(canvas, ...)
```

### 为什么需要传递 echarts 实例

1. **解耦**：ec-canvas 组件不依赖特定的 echarts 版本
2. **灵活性**：可以使用自定义构建的 echarts 来减小体积
3. **兼容性**：支持从 npm 或本地引入 echarts

## 验证步骤

### 1. 查看控制台日志

期望看到的日志：

```
ec-canvas: ready 生命周期触发
ec-canvas: echarts 对象 [object Object]
ec-canvas: 强制使用旧版 Canvas API (兼容 ECharts)
initOldCanvas: canvas 尺寸 { width: 343, height: 300 }
initOldCanvas: canvas context 创建成功
initOldCanvas: 调用 onInit 回调
WxChart: 初始化图表
WxChart: hasEcharts true
WxChart: ECharts 实例创建成功
```

**不应该看到**：
- ❌ `echarts.init is not a function`
- ❌ `echartsLib.init is not a function`
- ❌ `hasEcharts false`

### 2. 检查图表显示

期望看到：
- ✅ 图表正常显示
- ✅ 图表有正确的数据
- ✅ 支持交互（缩放、拖拽）
- ✅ 不再报错

## 技术细节

### echarts-for-weixin 的工作原理

echarts-for-weixin 是一个微信小程序组件，它：
1. 封装了微信小程序的 Canvas API
2. 提供了 Canvas 兼容层
3. 将 Canvas 上下文传递给外部回调
4. 期望外部使用 echarts 实例初始化图表

### 为什么必须传递 echarts 实例

因为 echarts-for-weixin 是一个通用组件，它：
- 不包含 echarts 核心库
- 不知道使用哪个版本的 echarts
- 需要外部提供 echarts 实例来初始化图表

## 常见问题

### Q1：为什么要用标准的 echarts 包？

**A**：
- 标准的 echarts 包功能最完整
- 更新及时，文档完善
- 性能最优
- 社区支持好

### Q2：echarts-for-weixin 有什么用？

**A**：
- 提供微信小程序的 Canvas 封装
- 处理 Canvas 兼容性问题
- 提供事件处理机制
- 简化微信小程序中使用 ECharts 的复杂度

### Q3：可以自定义构建 echarts 吗？

**A**：可以！可以构建一个只包含需要图表类型的 echarts，减小体积：

```javascript
// 1. 构建自定义 echarts
npm run build

// 2. 从本地引入
import * as echarts from './echarts.custom'

// 3. 传递给 ec-canvas
<ec-canvas echarts={echarts} ec={{ ec }} />
```

### Q4：echarts-for-weixin 版本重要吗？

**A**：不重要。echarts-for-weixin 只是一个容器，真正的图表功能由 echarts 包提供。但是，建议使用最新版本以获得最好的兼容性。

## 参考资料

- [ECharts 官方文档](https://echarts.apache.org/zh/index.html)
- [echarts-for-weixin GitHub](https://github.com/ecomfe/echarts-for-weixin)
- [echarts-for-weixin npm](https://www.npmjs.com/package/echarts-for-weixin)

## 总结

**问题根因**：
- 错误地认为 `echarts-for-weixin` 是一个 echarts 库
- 尝试从 `echarts-for-weixin` 调用 `echarts.init` 方法
- 实际上 `echarts-for-weixin` 不包含 echarts 核心库

**解决方案**：
1. 使用标准的 `echarts` 包
2. 将 echarts 实例传递给 ec-canvas 组件
3. 在 onInit 回调中使用传入的 echarts 实例初始化图表

**修复效果**：
- 图表应该可以正常显示
- 支持所有交互功能
- 不再出现 `echarts.init is not a function` 错误

**关键修改**：
```typescript
// WxChart 组件
import * as echarts from 'echarts'
<ec-canvas echarts={echarts} ec={{ ec }} />

// initChart 函数
const initChart = (canvas, width, height, echartsLib) => {
  const chart = echartsLib.init(canvas, ...)
}
```

---

**最后更新**：2026-02-26
**维护者**：AI 助手
