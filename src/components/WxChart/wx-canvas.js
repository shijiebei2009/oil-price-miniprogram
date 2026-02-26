// 适配小程序 canvas 的工具类
export default class WxCanvas {
  constructor(canvasNode, canvasId, isNew) {
    this.ctx = null
    this.canvasId = canvasId
    this.chart = null
    this.isNew = isNew

    if (isNew) {
      this.canvasNode = canvasNode
    } else {
      this._initStyle()
    }

    this._initEvent()
  }

  getContext(contextType) {
    if (contextType === '2d') {
      return this.ctx
    }
    return null
  }

  // 获取canvas的尺寸
  getBoundingClientRect() {
    if (this.isNew) {
      return this.canvasNode.getBoundingClientRect()
    }
    return {
      left: 0,
      top: 0,
      width: 300,
      height: 150
    }
  }

  _initStyle() {
    // 样式初始化
  }

  _initEvent() {
    this.eventNames = ['touchstart', 'touchmove', 'touchend']
    this.eventNames.forEach(name => {
      this.canvasId.addEventListener(name, event => {
        let touch = event.touches[0]
        let x = touch.clientX
        let y = touch.clientY

        if (name === 'touchmove') {
          event.preventDefault()
        }

        this.chart._zr.handler.dispatch(name, {
          zrX: x * this.chart._zr.dpr,
          zrY: y * this.chart._zr.dpr
        })
      })
    })
  }

  setChart(chart) {
    this.chart = chart
  }

  get width() {
    return this.canvasNode.width || 300
  }

  get height() {
    return this.canvasNode.height || 150
  }
}
