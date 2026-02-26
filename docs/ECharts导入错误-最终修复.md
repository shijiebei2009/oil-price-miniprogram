# ECharts 导入错误 - 最终修复

## 错误信息

```
WxChart: 图表初始化失败 <TypeError: t.addEventListener is not a function. (In 't.addEventListener(e,n,i)', 't.addEventListener' is undefined)>
```

## 根本原因（最终确认）

### 错误的导入方式

```typescript
// ❌ 错误：使用了标准的 echarts 包
import * as echarts from 'echarts'

const chart = echarts.init(canvas, null, {
  width: width,
  height: heightValue,
  devicePixelRatio: 1
})
```

**问题**：
- 标准的 `echarts` 包是为浏览器环境设计的
- 它内部使用了大量的 DOM API（如 `addEventListener`、`getBoundingClientRect` 等）
- 微信小程序的 Canvas 环境不支持这些 DOM API
- 导致 ECharts 初始化失败

### 正确的导入方式

```typescript
// ✅ 正确：使用专门为微信小程序封装的 echarts-for-weixin
import * as echarts from 'echarts-for-weixin'

const chart = echarts.init(canvas, null, {
  width: width,
  height: heightValue,
  devicePixelRatio: 1
})
```

**优势**：
- `echarts-for-weixin` 是专门为微信小程序封装的版本
- 它处理了微信小程序的 Canvas 兼容性问题
- 不依赖 DOM API
- 完全兼容微信小程序环境

## 修复内容

### 修改文件

**src/components/WxChart/index.tsx**

```typescript
// 修改前
import * as echarts from 'echarts'

// 修改后
import * as echarts from 'echarts-for-weixin'
```

### 其他修改

**src/components/ec-canvas/index.js**

强制使用旧版 Canvas API：

```javascript
init: function () {
  console.log('ec-canvas: 强制使用旧版 Canvas API (兼容 ECharts)')
  this.setData({ isUseNewCanvas: false })
  this.initOldCanvas()
},
```

## echarts-for-weixin vs echarts

### echarts（标准版）

**适用环境**：
- 浏览器
- Node.js
- React Native

**特点**：
- 使用标准 DOM API
- 功能最完整
- 性能最优
- 文档最完善

**不适用环境**：
- ❌ 微信小程序（Canvas 不支持 DOM API）
- ❌ 小程序（类似问题）

### echarts-for-weixin（小程序版）

**适用环境**：
- 微信小程序
- 其他小程序（需要适配）

**特点**：
- 专门为小程序环境优化
- 不依赖 DOM API
- 兼容小程序 Canvas API
- 功能与标准版基本一致

**限制**：
- 部分高级特性可能不支持
- 性能略低于标准版
- 文档相对较少

## 依赖关系

### 项目依赖

```json
{
  "dependencies": {
    "echarts": "^6.0.0",
    "echarts-for-weixin": "^1.0.2"
  }
}
```

**说明**：
- `echarts`：标准 ECharts 核心库（用于 H5 端）
- `echarts-for-weixin`：小程序专用版本（用于微信小程序端）
- 两个包可以共存

### 使用场景

```typescript
const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP

if (isWeapp) {
  // 微信小程序端：使用 echarts-for-weixin
  import * as echarts from 'echarts-for-weixin'
} else {
  // H5 端：使用标准 echarts
  import * as echarts from 'echarts'
}
```

## 验证步骤

### 1. 查看控制台日志

期望看到的日志：

```
ec-canvas: 强制使用旧版 Canvas API (兼容 ECharts)
initOldCanvas: canvas 尺寸 { width: 343, height: 300 }
initOldCanvas: canvas context 创建成功
initOldCanvas: 调用 onInit 回调
WxChart: 初始化图表
WxChart: ECharts 实例创建成功
```

**不应该看到**：
- ❌ `addEventListener is not a function`
- ❌ `t.addEventListener is undefined`

### 2. 检查图表显示

期望看到：
- ✅ 图表正常显示
- ✅ 图表有正确的数据
- ✅ 支持交互（缩放、拖拽）
- ✅ 图表样式正确

### 3. 测试功能

- 切换时间范围（7天、30天、90天、全部）
- 测试图表的缩放功能
- 测试图表的拖拽功能
- 测试图表的导出功能

## 技术细节

### echarts-for-weixin 的工作原理

1. **Canvas 兼容层**
   ```javascript
   // echarts-for-weixin 内部实现了 Canvas 兼容层
   // 将微信小程序的 Canvas Context 包装成类似 DOM Canvas 的对象
   ```

2. **事件处理**
   ```javascript
   // 不使用 DOM 事件，而是使用微信小程序的触摸事件
   canvas.onTouchStart = (e) => { ... }
   canvas.onTouchMove = (e) => { ... }
   canvas.onTouchEnd = (e) => { ... }
   ```

3. **尺寸获取**
   ```javascript
   // 不使用 getBoundingClientRect，而是通过参数传递
   const chart = echarts.init(canvas, null, {
     width: width,
     height: height,
     devicePixelRatio: 1
   })
   ```

### 为什么旧版 Canvas API 也可以

旧版 Canvas API (`wx.createCanvasContext`) 返回的是一个 Context 对象，这个对象：
- 不需要 DOM API 支持
- ECharts for Weixin 内部已经封装了所有需要的操作
- 与微信小程序的 Canvas 系统完全兼容

## 常见问题

### Q1：echarts-for-weixin 功能完整吗？

**A**：功能基本完整，支持大部分 ECharts 特性，包括：
- 折线图、柱状图、饼图等常见图表
- 交互功能（缩放、拖拽、提示框）
- 动画效果
- 主题配置

### Q2：echarts-for-weixin 性能如何？

**A**：性能略低于标准版，但对于大多数场景差异不明显。如果性能有特殊要求，可以考虑：
- 减少数据点数量
- 简化图表配置
- 使用数据缩放组件

### Q3：可以同时使用 echarts 和 echarts-for-weixin 吗？

**A**：可以。建议根据运行环境动态选择：
```typescript
import * as echartsWeapp from 'echarts-for-weixin'
import * as echartsWeb from 'echarts'

const echarts = Taro.getEnv() === Taro.ENV_TYPE.WEAPP ? echartsWeapp : echartsWeb
```

### Q4：echarts-for-weixin 版本更新及时吗？

**A**：`echarts-for-weixin` 会跟随 `echarts` 主版本更新，但可能会有一定的延迟。建议关注官方 GitHub 仓库。

## 参考资料

- [ECharts 官方文档](https://echarts.apache.org/zh/index.html)
- [echarts-for-weixin GitHub](https://github.com/ecomfe/echarts-for-weixin)
- [微信小程序 Canvas 文档](https://developers.weixin.qq.com/miniprogram/dev/api/canvas/wx.createCanvasContext.html)

## 总结

**问题根因**：使用了标准的 `echarts` 包，它依赖 DOM API，微信小程序的 Canvas 不支持这些 API。

**解决方案**：使用 `echarts-for-weixin`，它是专门为微信小程序封装的版本，不依赖 DOM API。

**修复效果**：图表应该可以正常显示，支持所有交互功能，不再出现 `addEventListener` 错误。

**关键修改**：
```typescript
// 一行代码修复
import * as echarts from 'echarts-for-weixin'
```

---

**最后更新**：2026-02-26
**维护者**：AI 助手
