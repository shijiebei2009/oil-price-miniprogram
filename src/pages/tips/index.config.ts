export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '加油建议',
      navigationBarBackgroundColor: '#2563eb',
      navigationBarTextStyle: 'white'
    })
  : {
      navigationBarTitleText: '加油建议',
      navigationBarBackgroundColor: '#2563eb',
      navigationBarTextStyle: 'white'
    }
