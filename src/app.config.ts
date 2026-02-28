export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/history/index',
    'pages/city/index',
    'pages/notice/index',
    'pages/tips/index',
    'pages/rank/index'
  ],
  permission: {
    'scope.userLocation': {
      desc: '你的位置信息将用于获取所在省份的油价信息'
    }
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '油价查询',
    navigationBarTextStyle: 'black'
  }
})
