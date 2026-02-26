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
    if (!this.data.ec) {
      console.warn('组件需绑定 ec 变量，例如：<ec-canvas id="mychart-dom-bar" canvas-id="mychart-bar" ec="{{ ec }}"></ec-canvas>')
      return
    }

    if (!this.data.ec.lazyLoad) {
      this.init()
    }
  },

  methods: {
    init: function () {
      const version = wx.getSystemInfoSync().SDKVersion

      const canUseNewCanvas = compareVersion(version, '2.9.0') >= 0
      const forceUseOldCanvas = this.data.forceUseOldCanvas

      if (forceUseOldCanvas || !canUseNewCanvas) {
        this.setData({ isUseNewCanvas: false })
        this.initOldCanvas()
      } else {
        this.setData({ isUseNewCanvas: true })
        this.initNewCanvas()
      }
    },

    initNewCanvas: function () {
      const query = wx.createSelectorQuery().in(this)
      query
        .select(`#${this.data.canvasId}`)
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res || !res[0]) {
            console.error('未找到 canvas 节点')
            return
          }

          const canvasNode = res[0].node

          const canvas = this.data.ec.canvas = canvasNode
          const canvasWidth = this.data.ec.width = res[0].width
          const canvasHeight = this.data.ec.height = res[0].height

          const ctx = canvas.getContext('2d')

          const dpr = wx.getSystemInfoSync().pixelRatio
          canvas.width = canvasWidth * dpr
          canvas.height = canvasHeight * dpr
          ctx.scale(dpr, dpr)

          this.data.ec.onInit(canvas, canvasWidth, canvasHeight)
        })
    },

    initOldCanvas: function () {
      const query = wx.createSelectorQuery().in(this)
      query
        .select(`#${this.data.canvasId}`)
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res || !res[0]) {
            console.error('未找到 canvas 节点')
            return
          }

          const canvasWidth = res[0].width
          const canvasHeight = res[0].height

          const ctx = wx.createCanvasContext(this.data.canvasId, this)

          this.data.ec.canvas = ctx
          this.data.ec.width = canvasWidth
          this.data.ec.height = canvasHeight

          this.data.ec.onInit(ctx, canvasWidth, canvasHeight)
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
