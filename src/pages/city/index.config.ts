export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '城市对比'
    })
  : {
      navigationBarTitleText: '城市对比'
    }
