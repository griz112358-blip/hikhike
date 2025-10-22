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

const AV = require('../../utils/av.js')

Page({
  data: {
    latitude: 31.229679,
    longitude: 121.447668,
    scale: 18,
    markers: [],
    polyline: [],
    routeId: 'path1',
    useSatellite: false,
    followTrack: false,
    maxAltitude: 0,
    totalAscent: 0,
    totalDistanceKmText: '0.00',
    // 展示信息
    title: '线路名称',
    subtitle: '',
    coverImg: 'https://lc-DNB4W2Wu.cn-n1.lcfile.com/5Iws1zYmdjQGFgQYhUN27RI0MtOFgA3J/logo%E5%B0%81%E9%9D%A2.png',
    difficultyTag: '标准',
    difficultyLevels: [],
    seasonText: '3-8月',
    estimatedHours: '--'
  },

  onReady() {
    try {
      this.mapCtx = wx.createMapContext('detailMap', this)
      // 如果轨迹已准备，适配视野
      if (this.gcjLinePoints && this.gcjLinePoints.length > 1) {
        this.fitMapToRoute()
      }
    } catch (e) {
      // ignore
    }
  },

  // 生成难度等级进度条数据
  generateDifficultyLevels(difficultyTag) {
    const difficultyMap = {
      '休闲': 1,
      '入门': 2,
      '进阶': 3,
      '挑战': 4,
      '极限': 5
    };
    
    const level = difficultyMap[difficultyTag] || 1;
    const colors = [
      '#4CAF50', // 绿色 - 休闲
      '#8BC34A', // 浅绿 - 入门
      '#FFC107', // 黄色 - 进阶
      '#FF9800', // 橙色 - 挑战
      '#F44336'  // 红色 - 极限
    ];
    
    const levels = [];
    for (let i = 0; i < 5; i++) {
      levels.push({
        color: i < level ? colors[level - 1] : '#eeeeee'
      });
    }
    
    return levels;
  },

  // 计算两点间距离（米）
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // 地球半径（米）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },

  // 处理海拔数据
  processElevationData(lineCoordinates) {
    if (!lineCoordinates || lineCoordinates.length < 2) {
      return [];
    }
    
    let totalDistance = 0;
    const elevationPoints = [];
    
    // 第一个点
    elevationPoints.push({
      distance: 0,
      elevation: lineCoordinates[0][2] || 0
    });
    
    // 计算每个点的累计距离和海拔
    for (let i = 1; i < lineCoordinates.length; i++) {
      const prev = lineCoordinates[i-1];
      const curr = lineCoordinates[i];
      
      const distance = this.calculateDistance(
        prev[1], prev[0], 
        curr[1], curr[0]
      );
      
      totalDistance += distance;
      elevationPoints.push({
        distance: totalDistance,
        elevation: curr[2] || 0
      });
    }
    
    return elevationPoints;
  },

  // 绘制海拔折线图
  drawElevationChart(elevationData) {
    if (!elevationData || elevationData.length === 0) {
      return;
    }
    
    const query = wx.createSelectorQuery();
    query.select('#elevationChart').boundingClientRect();
    query.select('.chart-container').boundingClientRect();
    query.exec((res) => {
      const canvasRect = res[0];
      const containerRect = res[1];
      if (!canvasRect || !containerRect) {
        return;
      }
      const canvas = canvasRect;
      const ctx = wx.createCanvasContext('elevationChart', this);
      
      // 使用容器尺寸绘制
      const width = containerRect.width;
      const height = 200;
      const padding = 40;
      const chartWidth = width - padding * 2;
      const chartHeight = height - padding * 2;
      
      console.log('Canvas尺寸:', width, 'x', height);
      
      // 计算海拔范围
      const elevations = elevationData.map(p => p.elevation);
      const minElevation = Math.min(...elevations);
      const maxElevation = Math.max(...elevations);
      const elevationRange = maxElevation - minElevation;
      
      // 计算距离范围
      const distances = elevationData.map(p => p.distance);
      const maxDistance = Math.max(...distances);
      
      // 清空画布
      ctx.clearRect(0, 0, width, height);
      
      // 绘制背景
      ctx.setFillStyle('#f6f7f9');
      ctx.fillRect(0, 0, width, height);
      
      // 绘制网格线
      ctx.setStrokeStyle('#e9ecef');
      ctx.setLineWidth(1);
      
      // 水平网格线
      for (let i = 0; i <= 4; i++) {
        const y = padding + (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
      }
      
      // 垂直网格线
      for (let i = 0; i <= 4; i++) {
        const x = padding + (chartWidth / 4) * i;
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, height - padding);
        ctx.stroke();
      }
      
      // 绘制折线
      ctx.setStrokeStyle('#2e7d32');
      ctx.setLineWidth(1);
      ctx.beginPath();
      
      elevationData.forEach((point, index) => {
        const x = padding + (point.distance / maxDistance) * chartWidth;
        const y = height - padding - ((point.elevation - minElevation) / elevationRange) * chartHeight;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
      
      // 绘制数据点
      ctx.setFillStyle('#2e7d32');
      elevationData.forEach((point) => {
        const x = padding + (point.distance / maxDistance) * chartWidth;
        const y = height - padding - ((point.elevation - minElevation) / elevationRange) * chartHeight;
        
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, 2 * Math.PI);
        ctx.fill();
      });
      
      // 绘制坐标轴标签
      ctx.setFillStyle('#666');
      ctx.setFontSize(12);
      
      // Y轴标签（海拔）
      for (let i = 0; i <= 4; i++) {
        const elevation = minElevation + (elevationRange / 4) * i;
        const y = height - padding - (chartHeight / 4) * i;
        ctx.fillText(Math.round(elevation) + 'm', 5, y + 4);
      }
      
      // X轴标签（距离）
      for (let i = 0; i <= 4; i++) {
        const distance = (maxDistance / 4) * i;
        const x = padding + (chartWidth / 4) * i;
        ctx.fillText((distance / 1000).toFixed(1) + 'km', x - 15, height - 10);
      }
      
      ctx.draw(false, () => {
        // 绘制完成
      });
    });
  },

  async onLoad(options) {
    // this.ensureSystemInfo()
    const opt = options || {}
    // 支持两种方式：id（LeanCloud objectId）或 route（本地内置 key）
    const id = opt.id
    const routeKey = opt.route
    try {
      if (id) {
        this.setData({ routeId: id })
        wx.showLoading({ title: '加载中', mask: true })
        const obj = await new AV.Query('KMLData').get(id)
        // 读取 kmlContent；要求云端字段存的是与 assets/path1.js 相同结构的 JSON 字符串
        const kmlContent = obj.get('kmlContent')
        // 详情展示字段（可选）
        const title = obj.get('routeName') || this.data.title
        const subtitle = obj.get('routeSubtitle') || this.data.subtitle
        const coverImg = obj.get('coverImg') || obj.get('coverUrl') || this.data.coverImg
        const difficultyTag = obj.get('difficultyTag') || this.data.difficultyTag
        const seasonText = obj.get('seasonText') || this.data.seasonText

        const maxAltitudeM = obj.get('maxAltitudeM')
        const totalLengthKm = obj.get('totalLengthKm')
        const estimatedHours = obj.get('estimatedHours')
        const cumulativeAscentM = obj.get('cumulativeAscentM')

        this.setData({ 
          title, 
          subtitle, 
          coverImg, 
          difficultyTag, 
          seasonText, 
          estimatedHours, 
          maxAltitudeM, 
          totalLengthKm, 
          cumulativeAscentM,
          difficultyLevels: this.generateDifficultyLevels(difficultyTag)
        })
        let geojson
        if (typeof kmlContent === 'string') {
          try {
            geojson = JSON.parse(kmlContent)
          } catch (e) {
            console.error('kmlContent 不是合法 JSON，尝试直接使用对象:', e)
            geojson = kmlContent
          }
        } else {
          geojson = kmlContent
        }
        if (!geojson || !geojson.features) {
          // 回退到本地示例
          console.warn('kmlContent 缺少 features，回退到本地示例数据')
          this.pathData = loadPathDataById('path1')
        } else {
          this.pathData = geojson
        }
      } else {
        const routeId = routeKey ? routeKey : 'path1'
        this.setData({ routeId })
        this.pathData = loadPathDataById(routeId)
      }
    } catch (error) {
      console.error('加载路径数据失败，回退到本地示例：', error)
      this.pathData = loadPathDataById('path1')
      this.setData({ routeId: 'path1' })
      wx.showToast({ title: '加载失败，使用示例', icon: 'none' })
    } finally {
      wx.hideLoading()
      this.initMapData()
    }
  },

  // 计算线路的地理中心和合适的缩放级别
  calculateMapCenterAndScale() {
    const lineStringFeature = this.pathData.features.find(f => f.geometry.type === 'LineString')
    const lineCoordinates = lineStringFeature.geometry.coordinates
    // 转 GCJ-02 再计算地图中心和缩放
    const transformed = lineCoordinates.map(coord => {
      const [lng, lat] = coord
      const { lat: gcjLat, lon: gcjLon } = wgs84togcj02(lat, lng)
      return [gcjLon, gcjLat, coord.length > 2 ? coord[2] : 0]
    })
    let minLat = transformed[0][1]
    let maxLat = transformed[0][1]
    let minLng = transformed[0][0]
    let maxLng = transformed[0][0]
    transformed.forEach(coord => {
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
    console.log('maxSpan', maxSpan)
    if (maxSpan > 0.1) {
      scale = 12
    } else if (maxSpan > 0.01) {
      scale = 13
    } else if (maxSpan > 0.005) {
      scale = 14
    } else if (maxSpan > 0.002) {
      scale = 15
    } else if (maxSpan > 0.001) {
      scale = 16
    } else {
      scale = 17
    }
    return { latitude: centerLat, longitude: centerLng, scale }
  },

  onOpenOtherMap() {
    wx.showToast({ title: '还没弄好，且等着吧 ☕️', icon: 'none' })
  },

  onToggleSatelliteBtn() {
    this.setData({ useSatellite: !this.data.useSatellite })
  },

  onToggleFollowTrack() {
    // 先确认定位授权，再跳转
    const go = () => {
      const id = this.data.routeId
      const isObjectId = id && id.length > 10
      const query = isObjectId ? `id=${id}` : `route=${id}`
      wx.navigateTo({ url: `/pages/follow/index?${query}` })
    }
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.userLocation']) {
          go()
        } else {
          wx.authorize({
            scope: 'scope.userLocation',
            success: go,
            fail: () => {
              wx.showModal({
                title: '需要定位权限',
                content: '用于显示当前位置与导航，请在设置中开启定位权限。',
                confirmText: '去设置',
                success: (r) => {
                  if (r.confirm) {
                    wx.openSetting({ success: (s) => { if (s.authSetting['scope.userLocation']) go() } })
                  }
                }
              })
            }
          })
        }
      }
    })
  },

  startFollowTrack() {
    // 简化实现：定时获取位置并更新地图中心
      wx.getLocation({
        type: 'wgs84',
        success: (res) => {
          const { lat, lon } = wgs84togcj02(res.latitude, res.longitude)
        // 使用 moveToLocation 更平滑（如可用）
          this.setData({ latitude: lat, longitude: lon })
        }
      })
  },

  // 让地图视野包含整条线路
  fitMapToRoute() {
    if (!this.mapCtx || !this.gcjLinePoints || this.gcjLinePoints.length === 0) return
    const points = this.gcjLinePoints.map(p => ({ latitude: p.latitude, longitude: p.longitude }))
    try {
      this.mapCtx.includePoints({ points, padding: [40, 40, 40, 40] })
    } catch (e) {
      // 设备不支持时忽略
    }
  },

  initMapData() {
    const mapConfig = this.calculateMapCenterAndScale()
    this.setData({ latitude: mapConfig.latitude, longitude: mapConfig.longitude, scale: mapConfig.scale })
    const lineStringFeatures = this.pathData.features.filter(f => f.geometry.type === 'LineString')
    const lineCoordinates = lineStringFeatures.map(lineString => lineString.geometry.coordinates)
    
    // 处理海拔数据
    if (lineCoordinates.length > 0) {
      const elevationData = this.processElevationData(lineCoordinates.flat())
      if (elevationData && elevationData.length > 0) {
        const CHART_ACCURACY = 100;
        if (elevationData.length > CHART_ACCURACY) {
          const _elevationData = Array.from({length: CHART_ACCURACY}, (_, i) => {
            const index = Math.floor(i * (elevationData.length / CHART_ACCURACY));
            return elevationData[index];
          })
          this.drawElevationChart(_elevationData);
        } else {
          this.drawElevationChart(elevationData);
        }
        
      }
    }
    // 起终点标注
    const startFeature = this.pathData.features.find(f => f.id === 'startPoint')
    const endFeature = this.pathData.features.find(f => f.id === 'endPoint')
    if (startFeature && endFeature) {
      const startPoint = startFeature.geometry.coordinates
      const endPoint = endFeature.geometry.coordinates
      const { lat: sLat, lon: sLon } = wgs84togcj02(startPoint[1], startPoint[0])
      const { lat: eLat, lon: eLon } = wgs84togcj02(endPoint[1], endPoint[0])
      this.setData({
        markers: [
          { id: 2, latitude: sLat, longitude: sLon, callout: { content: '起点', display: 'ALWAYS' }, width: 20, height: 30 },
          { id: 3, latitude: eLat, longitude: eLon, callout: { content: '终点', display: 'ALWAYS' }, width: 20, height: 30 }
        ]
      })
    }
    // 生成 GCJ-02 轨迹点
    const lineConvert = (item) => {
      const { lat, lon } = wgs84togcj02(item[1], item[0])
      return { latitude: lat, longitude: lon }
    }
    const polylineResult = lineCoordinates.map(pathItem => ({
      points: pathItem.map(lineConvert), color: '#FF0000DD', width: 4
    }))

    this.gcjLinePoints = polylineResult.map(pathItem => pathItem.points).flat()
    this.setData({
      polyline: polylineResult
    })
    // 地图渲染后自动适配视野
    setTimeout(() => {
      this.fitMapToRoute()
    }, 0)

  },

  // 分享给好友
  onShareAppMessage() {
    const { title, subtitle, coverImg, routeId } = this.data;
    const shareTitle = title || 'HikHike - 徒步路线详情';
    const shareDesc = subtitle || '户外徒步路线助手，探索自然之美';
    const { SHARE_DEFAULT_IMAGE_URL } = require('../../utils/constants.js');
    const shareImage = coverImg || SHARE_DEFAULT_IMAGE_URL;
    
    return {
      title: shareTitle,
      desc: shareDesc,
      path: `/pages/detail/index?id=${routeId}`,
      imageUrl: shareImage
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    const { title, routeId } = this.data;
    const shareTitle = title || 'HikHike - 徒步路线详情';
    
    const { SHARE_DEFAULT_IMAGE_URL } = require('../../utils/constants.js');
    return {
      title: shareTitle,
      query: `id=${routeId}`,
      imageUrl: this.data.coverImg || SHARE_DEFAULT_IMAGE_URL
    };
  }
})


