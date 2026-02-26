export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '历史价格'
    })
  : {
      navigationBarTitleText: '历史价格'
    }
