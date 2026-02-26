// WxCanvas 兼容层 - 包装微信小程序 Canvas Context
// 源自 echarts-for-weixin/src/wx-canvas.js

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
