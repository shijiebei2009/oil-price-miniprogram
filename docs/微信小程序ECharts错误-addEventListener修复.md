# 微信小程序 ECharts 错误：addEventListener is not a function

## 错误信息

```
WxChart: 图表初始化失败 <TypeError: t.addEventListener is not a function. (In 't.addEventListener(e,n,i)', 't.addEventListener' is undefined)>
```

## 根本原因分析

### 问题本质

ECharts 内部使用了标准的 DOM 事件 API（`addEventListener`），但微信小程序的 Canvas 节点对象**不支持**这些 DOM API。

### 技术细节

#### 新版 Canvas (type="2d")

微信小程序在基础库 2.9.0+ 引入了新版 Canvas API：

```javascript
// 新版 Canvas 初始化
const query = wx.createSelectorQuery().in(this)
query
  .select('#canvas')
  .fields({ node: true, size: true })
  .exec((res) => {
    const canvas = res[0].node  // ← 微信小程序的 Canvas 节点对象
    const ctx = canvas.getContext('2d')
  })
```

**关键问题**：
- `canvas` 是微信小程序的 Canvas 节点对象
- 这个对象**没有** `addEventListener` 方法
- 这个对象**不是**标准的 DOM Canvas 对象

#### ECharts 的依赖

ECharts 内部使用了以下 DOM API：
- `addEventListener`：绑定事件监听器
- `removeEventListener`：移除事件监听器
- `clientWidth` / `clientHeight`：获取元素尺寸
- `getBoundingClientRect`：获取元素位置

微信小程序的 Canvas 节点对象**不支持**这些 API，导致 ECharts 初始化失败。

### 错误发生流程

1. ec-canvas 使用新版 Canvas API 获取 Canvas 节点
2. 将 Canvas 节点对象传递给 ECharts
3. ECharts 尝试调用 `canvas.addEventListener` 方法
4. 微信小程序的 Canvas 节点没有这个方法
5. 抛出错误：`TypeError: t.addEventListener is not a function`

## 解决方案

### 方案 1：强制使用旧版 Canvas API（推荐）

强制使用旧版 Canvas API（`wx.createCanvasContext`），这样 ECharts 可以正常工作。

**优点**：
- 兼容性好，所有版本的微信小程序都支持
- ECharts 完全兼容，无需修改
- 稳定性高，不易出错

**缺点**：
- 性能略低于新版 Canvas API
- 不支持新版 Canvas 的一些高级特性

**实现代码**：

```javascript
// src/components/ec-canvas/index.js

init: function () {
  // 🔴 强制使用旧版 Canvas API
  console.log('ec-canvas: 强制使用旧版 Canvas API (兼容 ECharts)')
  this.setData({ isUseNewCanvas: false })
  this.initOldCanvas()
},

initOldCanvas: function () {
  const query = wx.createSelectorQuery().in(this)
  query
    .select(`#${this.data.canvasId}`)
    .fields({ size: true })  // ← 只查询 size，不查询 node
    .exec((res) => {
      if (!res || !res[0]) {
        console.error('未找到 canvas 节点')
        return
      }

      const canvasWidth = res[0].width
      const canvasHeight = res[0].height

      // 使用旧版 Canvas API
      const ctx = wx.createCanvasContext(this.data.canvasId, this)

      this.data.ec.canvas = ctx
      this.data.ec.width = canvasWidth
      this.data.ec.height = canvasHeight

      if (this.data.ec.onInit) {
        this.data.ec.onInit(ctx, canvasWidth, canvasHeight)
      }
    })
},
```

### 方案 2：使用兼容层（不推荐）

创建一个兼容层，将微信小程序的 Canvas 节点包装成类似 DOM Canvas 的对象。

**优点**：
- 可以使用新版 Canvas API
- 理论上性能更好

**缺点**：
- 实现复杂，容易出现兼容性问题
- 需要手动实现很多 DOM API
- 维护成本高

**不推荐原因**：
- 实现复杂度高
- 容易引入新的 bug
- 维护成本高
- 性能提升不明显

## 修复内容

### 修改的文件

1. **src/components/ec-canvas/index.js**
   - 强制使用旧版 Canvas API
   - 优化 initOldCanvas 方法，只查询 size
   - 添加详细的日志输出

### 关键修改

```javascript
// 修改前
if (forceUseOldCanvas || !canUseNewCanvas) {
  this.setData({ isUseNewCanvas: false })
  this.initOldCanvas()
} else {
  this.setData({ isUseNewCanvas: true })
  this.initNewCanvas()
}

// 修改后
// 🔴 强制使用旧版 Canvas，因为新版 Canvas 不兼容 ECharts
// 新版 Canvas 返回的节点对象没有 addEventListener 等 DOM 方法
console.log('ec-canvas: 强制使用旧版 Canvas API (兼容 ECharts)')
this.setData({ isUseNewCanvas: false })
this.initOldCanvas()
```

```javascript
// 修改前
query
  .select(`#${this.data.canvasId}`)
  .fields({ node: true, size: true })  // ← 查询 node 和 size
  .exec((res) => {
    const canvasNode = res[0].node
    // ...
  })

// 修改后
query
  .select(`#${this.data.canvasId}`)
  .fields({ size: true })  // ← 只查询 size
  .exec((res) => {
    // 不需要 node，直接使用 wx.createCanvasContext
    // ...
  })
```

## 验证步骤

### 1. 查看控制台日志

在微信开发者工具或真机调试中，打开控制台，查找以下日志：

```
ec-canvas: 强制使用旧版 Canvas API (兼容 ECharts)
initOldCanvas: 开始查询 canvas 尺寸
initOldCanvas: 查询结果
initOldCanvas: canvas 尺寸 { width: xxx, height: xxx }
initOldCanvas: canvas context 创建成功
initOldCanvas: 调用 onInit 回调
WxChart: 初始化图表
WxChart: ECharts 实例创建成功
```

### 2. 检查图表是否显示

- ✅ 图表应该正常显示
- ✅ 图表应该有正确的数据
- ✅ 图表应该支持交互（缩放、拖拽等）

### 3. 测试不同功能

- 切换时间范围（7天、30天、90天、全部）
- 测试图表的缩放功能
- 测试图表的拖拽功能
- 测试图表的导出功能

## 技术细节

### 旧版 Canvas API 工作原理

```javascript
// 1. 创建 Canvas Context
const ctx = wx.createCanvasContext(canvasId, this)

// 2. 使用 Context 绘制
ctx.setFillStyle('red')
ctx.fillRect(10, 10, 150, 75)

// 3. 调用 draw 方法将绘制内容渲染到 Canvas
ctx.draw()
```

### ECharts 与旧版 Canvas 的兼容性

ECharts for Weixin 内部已经处理了旧版 Canvas API 的兼容性：

1. ECharts 不直接调用 `addEventListener`，而是通过兼容层处理事件
2. ECharts 不直接访问 DOM 属性，而是通过微信小程序的 API 获取
3. ECharts 在微信小程序环境中使用特殊的初始化方式

```javascript
// ECharts for Weixin 的初始化方式
const chart = echarts.init(canvas, null, {
  width: width,
  height: height,
  devicePixelRatio: 1
})
```

### 为什么旧版 Canvas API 兼容

旧版 Canvas API 返回的是一个 Canvas Context 对象，这个对象：
- 不需要 DOM API 支持
- ECharts 内部已经封装了所有需要的操作
- 与微信小程序的 Canvas 系统完全兼容

## 常见问题

### Q1：旧版 Canvas API 会被废弃吗？

**A**：微信官方已经声明旧版 Canvas API 不会废弃，仍然会继续支持。虽然推荐使用新版 API，但旧版 API 仍然可用。

### Q2：旧版 Canvas API 的性能如何？

**A**：旧版 Canvas API 的性能略低于新版 API，但在大多数场景下差异不明显。对于简单的图表（如折线图、柱状图），性能差异可以忽略不计。

### Q3：是否需要修改 ECharts 的代码？

**A**：不需要。ECharts for Weixin 已经内置了对旧版 Canvas API 的支持，只需要正确初始化即可。

### Q4：其他图表库是否也有这个问题？

**A**：是的，任何依赖 DOM API 的图表库都会有这个问题。解决方案都是使用旧版 Canvas API 或创建兼容层。

## 参考资料

- [微信小程序 Canvas 文档](https://developers.weixin.qq.com/miniprogram/dev/api/canvas/wx.createCanvasContext.html)
- [ECharts For Weixin](https://github.com/ecomfe/echarts-for-weixin)
- [微信小程序 Canvas 2D 与旧版 Canvas 的区别](https://developers.weixin.qq.com/community/develop/article/doc/00024cf5d789e09a3fba488f557813)

## 总结

**问题根因**：新版 Canvas (type="2d") 返回的节点对象不支持 DOM API（如 `addEventListener`），导致 ECharts 初始化失败。

**解决方案**：强制使用旧版 Canvas API（`wx.createCanvasContext`），确保 ECharts 兼容。

**修复效果**：图表应该可以正常显示，支持所有交互功能。

---

**最后更新**：2026-02-26
**维护者**：AI 助手
