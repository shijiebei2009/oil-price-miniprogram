/* global wx, Component */
// 复制自 echarts-for-weixin/miniprogram_dist/index.js
function compareVersion(v1, v2) {
  v1 = v1.split('.')
  v2 = v2.split('.')
  const len = Math.max(v1.length, v2.length)

  while (v1.length < len) {
    v1.push('0')
  }
  while (v2.length < len) {
    v2.push('0')
  }

  for (let i = 0; i < len; i++) {
    const num1 = parseInt(v1[i])
    const num2 = parseInt(v2[i])

    if (num1 > num2) {
      return 1
    } else if (num1 < num2) {
      return -1
    }
  }
  return 0
}

Component({
  properties: {
    canvasId: {
      type: String,
      value: 'ec-canvas'
    },
    ec: {
      type: Object
    },
    forceUseOldCanvas: {
      type: Boolean,
      value: false
    }
  },

  data: {
    isUseNewCanvas: false
  },

  ready: function () {
    console.log('ec-canvas: ready 生命周期触发')
    console.log('ec-canvas: canvasId', this.data.canvasId)
    console.log('ec-canvas: ec 对象', this.data.ec)

    if (!this.data.ec) {
      console.warn('组件需绑定 ec 变量，例如：<ec-canvas id="mychart-dom-bar" canvas-id="mychart-bar" ec="{{ ec }}"></ec-canvas>')
      return
    }

    if (!this.data.ec.lazyLoad) {
      console.log('ec-canvas: 延迟 200ms 后开始初始化，确保 DOM 已渲染')
      // 延迟初始化，确保父容器已经渲染完成
      setTimeout(() => {
        this.init()
      }, 200)
    } else {
      console.log('ec-canvas: 延迟初始化模式，等待手动调用 init()')
    }
  },

  methods: {
    init: function () {
      const version = wx.getSystemInfoSync().SDKVersion

      const canUseNewCanvas = compareVersion(version, '2.9.0') >= 0
      const forceUseOldCanvas = this.data.forceUseOldCanvas

      console.log('ec-canvas: 初始化', {
        version,
        canUseNewCanvas,
        forceUseOldCanvas
      })

      if (forceUseOldCanvas || !canUseNewCanvas) {
        this.setData({ isUseNewCanvas: false })
        this.initOldCanvas()
      } else {
        this.setData({ isUseNewCanvas: true })
        this.initNewCanvas()
      }
    },

    initNewCanvas: function () {
      console.log('initNewCanvas: 开始查询 canvas 节点，canvasId:', this.data.canvasId)
      const query = wx.createSelectorQuery().in(this)
      query
        .select(`#${this.data.canvasId}`)
        .fields({ node: true, size: true })
        .exec((res) => {
          console.log('initNewCanvas: 查询结果', res)

          if (!res || !res[0]) {
            console.error('initNewCanvas: 未找到 canvas 节点，canvasId:', this.data.canvasId)
            console.error('initNewCanvas: 请检查以下几点：')
            console.error('  1. canvasId 是否正确')
            console.error('  2. 父容器是否有明确的宽度和高度')
            console.error('  3. Canvas 组件是否已正确渲染')
            return
          }

          const canvasNode = res[0].node
          const canvasWidth = res[0].width
          const canvasHeight = res[0].height

          console.log('initNewCanvas: canvas 节点获取成功')
          console.log('initNewCanvas: canvas 尺寸', { width: canvasWidth, height: canvasHeight })

          // 检查尺寸是否为 0
          if (canvasWidth === 0 || canvasHeight === 0) {
            console.error('initNewCanvas: Canvas 尺寸为 0！无法初始化图表')
            console.error('initNewCanvas: 父容器尺寸可能不正确，请检查父容器的 width 和 height')
            return
          }

          const canvas = this.data.ec.canvas = canvasNode
          this.data.ec.width = canvasWidth
          this.data.ec.height = canvasHeight

          const ctx = canvas.getContext('2d')

          const dpr = wx.getSystemInfoSync().pixelRatio
          console.log('initNewCanvas: 设备像素比', dpr)

          canvas.width = canvasWidth * dpr
          canvas.height = canvasHeight * dpr
          ctx.scale(dpr, dpr)
          console.log('initNewCanvas: canvas 尺寸已调整', {
            width: canvas.width,
            height: canvas.height,
            scale: dpr
          })

          if (this.data.ec.onInit) {
            console.log('initNewCanvas: 调用 onInit 回调')
            this.data.ec.onInit(canvas, canvasWidth, canvasHeight)
          }
        })
    },

    initOldCanvas: function () {
      console.log('initOldCanvas: 开始查询 canvas 节点，canvasId:', this.data.canvasId)
      const query = wx.createSelectorQuery().in(this)
      query
        .select(`#${this.data.canvasId}`)
        .fields({ node: true, size: true })
        .exec((res) => {
          console.log('initOldCanvas: 查询结果', res)

          if (!res || !res[0]) {
            console.error('initOldCanvas: 未找到 canvas 节点，canvasId:', this.data.canvasId)
            console.error('initOldCanvas: 请检查以下几点：')
            console.error('  1. canvasId 是否正确')
            console.error('  2. 父容器是否有明确的宽度和高度')
            console.error('  3. Canvas 组件是否已正确渲染')
            return
          }

          const canvasWidth = res[0].width
          const canvasHeight = res[0].height

          console.log('initOldCanvas: canvas 尺寸', { width: canvasWidth, height: canvasHeight })

          // 检查尺寸是否为 0
          if (canvasWidth === 0 || canvasHeight === 0) {
            console.error('initOldCanvas: Canvas 尺寸为 0！无法初始化图表')
            console.error('initOldCanvas: 父容器尺寸可能不正确，请检查父容器的 width 和 height')
            return
          }

          // 使用新版 API，即使是在旧版本中尝试
          if (typeof wx.createCanvasContext === 'undefined') {
            console.error('initOldCanvas: wx.createCanvasContext 不存在')
            return
          }

          const ctx = wx.createCanvasContext(this.data.canvasId, this)
          console.log('initOldCanvas: canvas context 创建成功')

          this.data.ec.canvas = ctx
          this.data.ec.width = canvasWidth
          this.data.ec.height = canvasHeight

          if (this.data.ec.onInit) {
            console.log('initOldCanvas: 调用 onInit 回调')
            this.data.ec.onInit(ctx, canvasWidth, canvasHeight)
          }
        })
    },

    canvasToTempFilePath: function (opt) {
      if (this.data.isUseNewCanvas) {
        const query = wx.createSelectorQuery().in(this)
        query
          .select(`#${this.data.canvasId}`)
          .fields({ node: true, size: true })
          .exec((res) => {
            const canvasNode = res[0].node
            opt.canvas = canvasNode
            wx.canvasToTempFilePath(opt)
          })
      } else {
        if (!opt.canvasId) {
          opt.canvasId = this.data.canvasId
        }
        wx.canvasToTempFilePath(opt, this)
      }
    },

    touchStart: function (e) {
      if (this.data.ec && this.data.ec.onTouchStart) {
        this.data.ec.onTouchStart(e)
      }
    },

    touchMove: function (e) {
      if (this.data.ec && this.data.ec.onTouchMove) {
        this.data.ec.onTouchMove(e)
      }
    },

    touchEnd: function (e) {
      if (this.data.ec && this.data.ec.onTouchEnd) {
        this.data.ec.onTouchEnd(e)
      }
    }
  }
})
