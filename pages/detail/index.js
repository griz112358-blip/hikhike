// pages/detail/index.js
const { wgs84togcj02, getDistance } = require('../../utils/util.js')

// 简单路由到数据源的映射，目前仅内置 path1
function loadPathDataById(routeId) {
  switch (routeId) {
    case 'path1':
    default:
      return require('../../assets/path1.js')
  }
}

Page({
  data: {
    latitude: 31.229679,
    longitude: 121.447668,
    scale: 18,
    markers: [],
    polyline: [],
    totalDistance: 0,
    userLocation: null,
    routeId: 'path1'
  },

  onLoad(options) {
    this.ensureSystemInfo()
    const routeId = options && options.route ? options.route : 'path1'
    this.setData({ routeId })
    this.pathData = loadPathDataById(routeId)
    this.initMapData()
    this.getUserLocation()
  },

  // 确保系统信息已初始化（与首页保持一致实现）
  ensureSystemInfo() {
    const app = getApp()
    if (!app.globalData.deviceInfo) {
      try {
        const deviceInfo = wx.getDeviceInfo()
        const windowInfo = wx.getWindowInfo()
        const appBaseInfo = wx.getAppBaseInfo()
        app.globalData.deviceInfo = deviceInfo
        app.globalData.windowInfo = windowInfo
        app.globalData.appBaseInfo = appBaseInfo
        app.globalData.brand = deviceInfo.brand || 'unknown'
        app.globalData.screenWidth = windowInfo.screenWidth || 375
        app.globalData.screenHeight = windowInfo.screenHeight || 667
        app.globalData.pixelRatio = windowInfo.pixelRatio || 2
        app.globalData.platform = deviceInfo.platform || 'unknown'
        app.globalData.system = deviceInfo.system || 'unknown'
      } catch (error) {
        console.error('Failed to get system info in detail page:', error)
      }
    }
  },

  // 计算线路的地理中心和合适的缩放级别
  calculateMapCenterAndScale() {
    const lineStringFeature = this.pathData.features.find(f => f.geometry.type === 'LineString')
    const lineCoordinates = lineStringFeature.geometry.coordinates
    let minLat = lineCoordinates[0][1]
    let maxLat = lineCoordinates[0][1]
    let minLng = lineCoordinates[0][0]
    let maxLng = lineCoordinates[0][0]
    lineCoordinates.forEach(coord => {
      const [lng, lat] = coord
      minLat = Math.min(minLat, lat)
      maxLat = Math.max(maxLat, lat)
      minLng = Math.min(minLng, lng)
      maxLng = Math.max(maxLng, lng)
    })
    const centerLat = (minLat + maxLat) / 2
    const centerLng = (minLng + maxLng) / 2
    const latSpan = maxLat - minLat
    const lngSpan = maxLng - minLng
    const maxSpan = Math.max(latSpan, lngSpan)
    let scale = 18
    if (maxSpan > 0.01) {
      scale = 14
    } else if (maxSpan > 0.005) {
      scale = 15
    } else if (maxSpan > 0.002) {
      scale = 16
    } else if (maxSpan > 0.001) {
      scale = 17
    } else {
      scale = 18
    }
    return { latitude: centerLat, longitude: centerLng, scale }
  },

  getUserLocation() {
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.userLocation']) {
          this.requestLocation()
        } else {
          wx.authorize({
            scope: 'scope.userLocation',
            success: () => {
              this.requestLocation()
            },
            fail: () => {
              this.updateMarkers()
            }
          })
        }
      }
    })
  },

  requestLocation() {
    wx.getLocation({
      type: 'wgs84',
      success: (res) => {
        try {
          const { lat, lon } = wgs84togcj02(res.latitude, res.longitude)
          this.setData({ userLocation: { latitude: lat, longitude: lon } })
          this.updateMarkers(lat, lon)
        } catch (error) {
          console.error('坐标转换失败:', error)
          this.updateMarkers()
        }
      },
      fail: () => {
        this.updateMarkers()
      }
    })
  },

  updateMarkers(userLat = null, userLng = null) {
    const startFeature = this.pathData.features.find(f => f.id === 'startPoint')
    const endFeature = this.pathData.features.find(f => f.id === 'endPoint')
    const startPoint = startFeature.geometry.coordinates
    const endPoint = endFeature.geometry.coordinates
    const markers = [
      { id: 2, latitude: startPoint[1], longitude: startPoint[0], callout: { content: '起点', display: 'ALWAYS' }, iconPath: 'https://cdn-icons-png.flaticon.com/128/447/447031.png', width: 20, height: 20 },
      { id: 3, latitude: endPoint[1], longitude: endPoint[0], callout: { content: '终点', display: 'ALWAYS' }, iconPath: 'https://cdn-icons-png.flaticon.com/128/5359/5359315.png', width: 20, height: 20 }
    ]
    // 如需显示用户位置标记，可取消注释
    // if (userLat && userLng) {
    //   markers.unshift({ id: 1, latitude: userLat, longitude: userLng, callout: { content: '我在这里', display: 'ALWAYS' } })
    // }
    this.setData({ markers })
  },

  initMapData() {
    const mapConfig = this.calculateMapCenterAndScale()
    this.setData({ latitude: mapConfig.latitude, longitude: mapConfig.longitude, scale: mapConfig.scale })
    const lineStringFeature = this.pathData.features.find(f => f.geometry.type === 'LineString')
    const lineCoordinates = lineStringFeature.geometry.coordinates
    this.setData({
      polyline: [{ points: lineCoordinates.map(item => ({ latitude: item[1], longitude: item[0] })), color: '#FF0000DD', width: 4 }]
    })
    let calculatedDistance = 0
    for (let i = 0; i < lineCoordinates.length - 1; i++) {
      const p1 = lineCoordinates[i]
      const p2 = lineCoordinates[i + 1]
      calculatedDistance += getDistance(p1[1], p1[0], p2[1], p2[0])
    }
    this.setData({ totalDistance: parseFloat(calculatedDistance.toFixed(2)) })
  }
})


