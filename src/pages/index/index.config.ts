export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '油价查询',
      enableShareAppMessage: true
    })
  : {
      navigationBarTitleText: '油价查询'
    }
