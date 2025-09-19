export default defineAppConfig({
  pages: [
    'pages/index/index'
  ],
  requiredPrivateInfos: [
    'getLocation'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'WeChat',
    navigationBarTextStyle: 'black'
  },
  permission: {
    'scope.userLocation': {
      desc: '将获取你的具体位置信息',
    },
  },
})
