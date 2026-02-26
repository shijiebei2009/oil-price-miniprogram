export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '调价提醒'
    })
  : {
      navigationBarTitleText: '调价提醒'
    }
