export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '历史价格',
      usingComponents: {}
    })
  : {
      navigationBarTitleText: '历史价格',
      usingComponents: {}
    }
