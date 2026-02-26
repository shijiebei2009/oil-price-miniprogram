export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '历史价格',
      usingComponents: {
        'ec-canvas': '../../components/ec-canvas/index'
      }
    })
  : {
      navigationBarTitleText: '历史价格',
      usingComponents: {
        'ec-canvas': '../../components/ec-canvas/index'
      }
    }
