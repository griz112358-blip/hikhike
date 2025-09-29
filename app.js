// app.js
App({
  onLaunch() {
    console.log('App launched.')
    
    // 初始化系统信息，防止 LifeCycle 访问 null 对象
    this.initSystemInfo()
  },
  
  initSystemInfo() {
    try {
      // 使用新 API，兼容旧版并兜底
      let deviceInfo = null
      let windowInfo = null
      let appBaseInfo = null

      if (typeof wx.getDeviceInfo === 'function') {
        deviceInfo = wx.getDeviceInfo() || null
      }
      if (!deviceInfo && typeof wx.getSystemInfoSync === 'function') {
        try {
          deviceInfo = wx.getSystemInfoSync() || null
        } catch (e) {
          deviceInfo = null
        }
      }

      if (typeof wx.getWindowInfo === 'function') {
        windowInfo = wx.getWindowInfo() || null
      }
      if (!windowInfo && typeof wx.getSystemInfoSync === 'function') {
        const sys = deviceInfo || (function () { try { return wx.getSystemInfoSync() } catch (e) { return null } })()
        windowInfo = sys ? {
          screenWidth: sys.screenWidth,
          screenHeight: sys.screenHeight,
          pixelRatio: sys.pixelRatio
        } : null
      }

      if (typeof wx.getAppBaseInfo === 'function') {
        appBaseInfo = wx.getAppBaseInfo() || null
      }

      // 计算安全值
      const brand = deviceInfo && deviceInfo.brand ? deviceInfo.brand : 'unknown'
      const screenWidth = windowInfo && windowInfo.screenWidth ? windowInfo.screenWidth : 375
      const screenHeight = windowInfo && windowInfo.screenHeight ? windowInfo.screenHeight : 667
      const pixelRatio = windowInfo && windowInfo.pixelRatio ? windowInfo.pixelRatio : 2
      const platform = deviceInfo && deviceInfo.platform ? deviceInfo.platform : 'unknown'
      const system = deviceInfo && deviceInfo.system ? deviceInfo.system : 'unknown'

      // 不替换对象本身，避免引用丢失
      const gd = this.globalData || {}
      gd.deviceInfo = deviceInfo || null
      gd.windowInfo = windowInfo || null
      gd.appBaseInfo = appBaseInfo || null
      gd.brand = brand
      gd.screenWidth = screenWidth
      gd.screenHeight = screenHeight
      gd.pixelRatio = pixelRatio
      gd.platform = platform
      gd.system = system
      this.globalData = gd
    } catch (error) {
      console.error('Failed to get system info:', error)
      // 仅设置字段，保持对象引用
      const gd = this.globalData || {}
      gd.deviceInfo = null
      gd.windowInfo = null
      gd.appBaseInfo = null
      gd.brand = 'unknown'
      gd.screenWidth = 375
      gd.screenHeight = 667
      gd.pixelRatio = 2
      gd.platform = 'unknown'
      gd.system = 'unknown'
      this.globalData = gd
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
