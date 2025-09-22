// app.js
App({
  onLaunch() {
    console.log('App launched.')
    
    // 初始化系统信息，防止 LifeCycle 访问 null 对象
    this.initSystemInfo()
  },
  
  initSystemInfo() {
    try {
      // 使用新的 API 获取系统信息
      const deviceInfo = wx.getDeviceInfo()
      const windowInfo = wx.getWindowInfo()
      const appBaseInfo = wx.getAppBaseInfo()
      
      console.log('Device info:', deviceInfo)
      console.log('Window info:', windowInfo)
      console.log('App base info:', appBaseInfo)
      
      // 将系统信息存储到全局数据中
      this.globalData = {
        deviceInfo: deviceInfo,
        windowInfo: windowInfo,
        appBaseInfo: appBaseInfo,
        brand: deviceInfo.brand || 'unknown',
        screenWidth: windowInfo.screenWidth || 375,
        screenHeight: windowInfo.screenHeight || 667,
        pixelRatio: windowInfo.pixelRatio || 2,
        platform: deviceInfo.platform || 'unknown',
        system: deviceInfo.system || 'unknown'
      }
    } catch (error) {
      console.error('Failed to get system info:', error)
      // 设置默认值
      this.globalData = {
        deviceInfo: null,
        windowInfo: null,
        appBaseInfo: null,
        brand: 'unknown',
        screenWidth: 375,
        screenHeight: 667,
        pixelRatio: 2,
        platform: 'unknown',
        system: 'unknown'
      }
    }
  },
  
  globalData: {
    deviceInfo: null,
    windowInfo: null,
    appBaseInfo: null,
    brand: 'unknown',
    screenWidth: 375,
    screenHeight: 667,
    pixelRatio: 2,
    platform: 'unknown',
    system: 'unknown'
  }
})
