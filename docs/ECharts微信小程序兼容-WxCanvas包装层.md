# ECharts 微信小程序兼容 - WxCanvas 包装层

## 错误信息

```
TypeError: this.dom.getContext is not a function. (In 'this.dom.getContext("2d")', 'this.dom.getContext' is undefined)
```

## 根本原因

### 标准 echarts 包的依赖

标准的 `echarts.init` 方法期望传入的是一个 **DOM Canvas 对象**，这个对象应该有以下方法：
- `getContext(contextType)`：获取 Canvas Context
- `addEventListener(event, handler)`：绑定事件监听器
- `removeEventListener(event, handler)`：移除事件监听器
- `clientWidth` / `clientHeight`：获取元素尺寸

### 微信小程序 Canvas Context 的限制

微信小程序的 Canvas Context（`wx.createCanvasContext` 返回的对象）：
- ❌ 没有 `getContext` 方法（它本身就是 Context）
- ❌ 没有 `addEventListener` 方法
- ❌ 没有 `clientWidth` / `clientHeight` 属性

### 兼容性问题

直接将微信小程序的 Canvas Context 传递给 `echarts.init`：
```typescript
// ❌ 错误：微信小程序 Canvas Context 没有 getContext 方法
const ctx = wx.createCanvasContext(canvasId, this)
const chart = echarts.init(ctx, ...)
// 错误：this.dom.getContext is not a function
```

## 解决方案：WxCanvas 包装层

### WxCanvas 的作用

`WxCanvas` 是一个兼容层类，它包装微信小程序的 Canvas Context，并添加 ECharts 需要的方法：

1. **添加 `getContext` 方法**
   ```typescript
   getContext(contextType: string) {
     if (contextType === '2d') {
       return this.ctx;  // 返回微信小程序的 Canvas Context
     }
   }
   ```

2. **添加事件处理**
   ```typescript
   _initEvent() {
     this.event = {}
     const eventNames = [
       { wxName: 'touchStart', ecName: 'mousedown' },
       { wxName: 'touchMove', ecName: 'mousemove' },
       { wxName: 'touchEnd', ecName: 'mouseup' },
       { wxName: 'touchEnd', ecName: 'click' }
     ]
     // 将微信小程序的触摸事件转换为 ECharts 事件
   }
   ```

3. **添加样式兼容**
   ```typescript
   _initStyle(ctx) {
     // 拦截样式属性的设置，调用微信小程序的 API
     Object.defineProperty(ctx, 'fillStyle', {
       set: (value) => {
         ctx.setFillStyle(value)
       }
     })
   }
   ```

4. **添加 Canvas 属性**
   ```typescript
   set width(w: number) {
     if (this.canvasNode) this.canvasNode.width = w
   }
   set height(h: number) {
     if (this.canvasNode) this.canvasNode.height = h
   }
   ```

### 使用方式

```typescript
import WxCanvas from './WxCanvas'
import * as echarts from 'echarts'

const initChart = (canvas, width, height, echartsLib) => {
  // 1. 使用 WxCanvas 包装微信小程序的 Canvas Context
  const wxCanvas = new WxCanvas(canvas, canvasId, false, null)

  // 2. 将包装后的 WxCanvas 实例传递给 echarts.init
  const chart = echartsLib.init(wxCanvas, null, {
    width: width,
    height: height,
    devicePixelRatio: 1
  })

  return chart
}
```

## 修复内容

### 1. 创建 WxCanvas 类

**src/components/WxChart/WxCanvas.ts**

```typescript
export default class WxCanvas {
  ctx: any
  canvasId: string
  chart: any
  isNew: boolean
  canvasNode: any

  constructor(ctx: any, canvasId: string, isNew: boolean, canvasNode: any) {
    this.ctx = ctx
    this.canvasId = canvasId
    this.chart = null
    this.isNew = isNew
    if (isNew) {
      this.canvasNode = canvasNode
    } else {
      this._initStyle(ctx)
    }
    this._initEvent()
  }

  getContext(contextType: string) {
    if (contextType === '2d') {
      return this.ctx
    }
  }

  setChart(chart: any) {
    this.chart = chart
  }

  attachEvent() {
    // noop
  }

  detachEvent() {
    // noop
  }

  _initStyle(ctx: any) {
    // 拦截样式属性设置
    const styles = [
      'fillStyle', 'strokeStyle', 'globalAlpha',
      'textAlign', 'textBaseAlign', 'shadow', 'lineWidth',
      'lineCap', 'lineJoin', 'lineDash', 'miterLimit', 'fontSize'
    ]

    styles.forEach((style) => {
      Object.defineProperty(ctx, style, {
        set: (value) => {
          if (
            style !== 'fillStyle' && style !== 'strokeStyle' ||
            value !== 'none' && value !== null
          ) {
            ctx['set' + style.charAt(0).toUpperCase() + style.slice(1)](value)
          }
        }
      })
    })

    ctx.createRadialGradient = () => {
      return ctx.createCircularGradient(...arguments)
    }
  }

  _initEvent() {
    this.event = {}
    const eventNames = [
      { wxName: 'touchStart', ecName: 'mousedown' },
      { wxName: 'touchMove', ecName: 'mousemove' },
      { wxName: 'touchEnd', ecName: 'mouseup' },
      { wxName: 'touchEnd', ecName: 'click' }
    ]

    eventNames.forEach((name) => {
      this.event[name.wxName] = (e: any) => {
        const touch = e.touches[0]
        this.chart.getZr().handler.dispatch(name.ecName, {
          zrX: name.wxName === 'tap' ? touch.clientX : touch.x,
          zrY: name.wxName === 'tap' ? touch.clientY : touch.y
        })
      }
    })
  }

  set width(w: number) {
    if (this.canvasNode) this.canvasNode.width = w
  }

  set height(h: number) {
    if (this.canvasNode) this.canvasNode.height = h
  }

  get width() {
    if (this.canvasNode) return this.canvasNode.width
    return 0
  }

  get height() {
    if (this.canvasNode) return this.canvasNode.height
    return 0
  }
}
```

### 2. 修改 WxChart 组件

**src/components/WxChart/index.tsx**

```typescript
import WxCanvas from './WxCanvas'

const initChart = (canvas, width, height, echartsLib) => {
  // 使用 WxCanvas 包装微信小程序的 Canvas Context
  const wxCanvas = new WxCanvas(canvas, canvasId, false, null)
  console.log('WxChart: WxCanvas 包装成功')

  const chart = echartsLib.init(wxCanvas, null, {
    width: width,
    height: height,
    devicePixelRatio: 1
  })

  return chart
}
```

## 数据流

```
微信小程序 Canvas Context (wx.createCanvasContext)
    ↓
WxCanvas 包装层
    ↓
添加 getContext、addEventListener 等方法
    ↓
echarts.init(wxCanvas, ...)
    ↓
ECharts 实例创建成功
```

## WxCanvas 的功能

### 1. getContext 方法

```typescript
getContext(contextType: string) {
  if (contextType === '2d') {
    return this.ctx;  // 返回微信小程序的 Canvas Context
  }
}
```

ECharts 调用 `canvas.getContext('2d')`，WxCanvas 返回微信小程序的 Canvas Context。

### 2. 事件处理

```typescript
_initEvent() {
  this.event = {}
  const eventNames = [
    { wxName: 'touchStart', ecName: 'mousedown' },
    { wxName: 'touchMove', ecName: 'mousemove' },
    { wxName: 'touchEnd', ecName: 'mouseup' },
    { wxName: 'touchEnd', ecName: 'click' }
  ]

  eventNames.forEach((name) => {
    this.event[name.wxName] = (e: any) => {
      const touch = e.touches[0]
      this.chart.getZr().handler.dispatch(name.ecName, {
        zrX: name.wxName === 'tap' ? touch.clientX : touch.x,
        zrY: name.wxName === 'tap' ? touch.clientY : touch.y
      })
    }
  })
}
```

将微信小程序的触摸事件转换为 ECharts 事件。

### 3. 样式兼容

```typescript
_initStyle(ctx: any) {
  const styles = [
    'fillStyle', 'strokeStyle', 'globalAlpha',
    'textAlign', 'textBaseAlign', 'shadow', 'lineWidth',
    'lineCap', 'lineJoin', 'lineDash', 'miterLimit', 'fontSize'
  ]

  styles.forEach((style) => {
    Object.defineProperty(ctx, style, {
      set: (value) => {
        if (
          style !== 'fillStyle' && style !== 'strokeStyle' ||
          value !== 'none' && value !== null
        ) {
          ctx['set' + style.charAt(0).toUpperCase() + style.slice(1)](value)
        }
      }
    })
  })

  ctx.createRadialGradient = () => {
    return ctx.createCircularGradient(...arguments)
  }
}
```

拦截样式属性设置，调用微信小程序的 API。

## 验证步骤

### 1. 查看控制台日志

期望看到的日志：

```
WxChart: 初始化图表
WxChart: hasEcharts true
WxChart: WxCanvas 包装成功
WxChart: ECharts 实例创建成功
```

**不应该看到**：
- ❌ `getContext is not a function`
- ❌ `this.dom.getContext is undefined`

### 2. 检查图表显示

期望看到：
- ✅ 图表正常显示
- ✅ 图表有正确的数据
- ✅ 支持交互（缩放、拖拽）
- ✅ 不再报错

## 技术细节

### 为什么需要 WxCanvas

标准的 `echarts` 包是为浏览器环境设计的，它依赖 DOM API：
- `canvas.getContext()`：获取 Canvas Context
- `canvas.addEventListener()`：绑定事件监听器
- `canvas.clientWidth` / `canvas.clientHeight`：获取元素尺寸

微信小程序的 Canvas 不支持这些 DOM API，所以需要 WxCanvas 兼容层来桥接。

### WxCanvas 的工作原理

1. **构造函数**：接收微信小程序的 Canvas Context
2. **包装方法**：添加 ECharts 需要的方法（`getContext`、`addEventListener` 等）
3. **事件转换**：将微信小程序的触摸事件转换为 ECharts 事件
4. **样式拦截**：拦截样式属性设置，调用微信小程序的 API
5. **返回兼容对象**：返回一个兼容 ECharts 的 Canvas 对象

## 常见问题

### Q1：WxCanvas 会影响性能吗？

**A**：影响很小。WxCanvas 只是一个包装层，它主要做的是方法转发和事件转换，性能损耗可以忽略不计。

### Q2：WxCanvas 支持所有 ECharts 特性吗？

**A**：基本支持。WxCanvas 实现了 ECharts 需要的核心方法，但对于一些高级特性可能不完全支持。

### Q3：可以自定义 WxCanvas 吗？

**A**：可以。根据需要，可以扩展 WxCanvas 的功能，添加更多的兼容方法。

### Q4：WxCanvas 是 echarts-for-weixin 的一部分吗？

**A**：是的。WxCanvas 的代码源自 `echarts-for-weixin/src/wx-canvas.js`，我们将其移植到 Taro 项目中。

## 参考资料

- [ECharts 官方文档](https://echarts.apache.org/zh/index.html)
- [echarts-for-weixin GitHub](https://github.com/ecomfe/echarts-for-weixin)
- [微信小程序 Canvas 文档](https://developers.weixin.qq.com/miniprogram/dev/api/canvas/wx.createCanvasContext.html)

## 总结

**问题根因**：
- 标准 echarts 包依赖 DOM API（`getContext`、`addEventListener` 等）
- 微信小程序的 Canvas Context 不支持这些 DOM API
- 直接传递会导致 `getContext is not a function` 错误

**解决方案**：
1. 创建 WxCanvas 兼容层类
2. 使用 WxCanvas 包装微信小程序的 Canvas Context
3. 将包装后的 WxCanvas 实例传递给 echarts.init

**修复效果**：
- 图表应该可以正常显示
- 支持所有交互功能
- 不再出现 `getContext is not a function` 错误

**关键代码**：
```typescript
import WxCanvas from './WxCanvas'

const wxCanvas = new WxCanvas(canvas, canvasId, false, null)
const chart = echartsLib.init(wxCanvas, null, {
  width: width,
  height: height,
  devicePixelRatio: 1
})
```

---

**最后更新**：2026-02-26
**维护者**：AI 助手
