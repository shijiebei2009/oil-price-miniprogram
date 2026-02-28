export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '全国油价排名',
      navigationBarBackgroundColor: '#3b82f6',
      navigationBarTextStyle: 'white'
    })
  : {
      navigationBarTitleText: '全国油价排名',
      navigationBarBackgroundColor: '#3b82f6',
      navigationBarTextStyle: 'white'
    }
