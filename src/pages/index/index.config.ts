export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '油价查询'
    })
  : {
      navigationBarTitleText: '油价查询'
    }
