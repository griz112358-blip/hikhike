// pages/routes/index.js

Page({
  data: {
    routes: [],
    loading: true,
    error: '',
    empty: false
  },

  onLoad() {
    this.fetchRoutes()
  },

  // 计算最高海拔（复用详情页逻辑）
  calculateMaxAltitude(points) {
    if (!points || points.length === 0) return 0
    const elevations = points.map(p => p[2] || 0).filter(e => e > 0)
    return elevations.length > 0 ? Math.max(...elevations) : 0
  },

  // 计算累计爬升（复用详情页逻辑）
  calculateTotalAscent(points) {
    if (!points || points.length < 2) return 0
    let totalAscent = 0
    for (let i = 1; i < points.length; i++) {
      const prevElev = points[i - 1][2] || 0
      const currElev = points[i][2] || 0
      if (currElev > prevElev) {
        const diff = currElev - prevElev
        totalAscent = Math.round((totalAscent + diff) * 100) / 100
      }
    }
    return parseFloat(totalAscent.toFixed(2))
  },

  // 计算预估时间（复用详情页逻辑）
  calculateEstimatedTime(length_km, totalAscent) {
    const timeFromDistance = parseFloat((length_km / 3).toFixed(2))  // 小时
    const timeFromAscent = parseFloat(((totalAscent / 100) * 5 / 60).toFixed(2))  // 小时
    return parseFloat((timeFromDistance + timeFromAscent).toFixed(1))
  },

  // 计算难度等级（基于距离、爬升、海拔）
  calculateDifficulty(length_km, totalAscentM, maxAltitudeM) {
    // 计算综合评分
    let score = 0

    // 距离因素（最大 25 分）
    if (length_km < 5) {
      score += 5
    } else if (length_km < 10) {
      score += 10
    } else if (length_km < 20) {
      score += 15
    } else if (length_km < 30) {
      score += 20
    } else {
      score += 25
    }

    // 累计爬升因素（最大 40 分）
    if (totalAscentM < 300) {
      score += 5
    } else if (totalAscentM < 500) {
      score += 10
    } else if (totalAscentM < 800) {
      score += 20
    } else if (totalAscentM < 1200) {
      score += 30
    } else {
      score += 40
    }

    // 最高海拔因素（最大 35 分）
    if (maxAltitudeM < 1000) {
      score += 5
    } else if (maxAltitudeM < 2000) {
      score += 10
    } else if (maxAltitudeM < 3000) {
      score += 20
    } else if (maxAltitudeM < 4000) {
      score += 30
    } else {
      score += 35
    }

    // 根据总分返回难度等级
    if (score < 25) {
      return '休闲'
    } else if (score < 40) {
      return '入门'
    } else if (score < 60) {
      return '进阶'
    } else if (score < 80) {
      return '挑战'
    } else {
      return '极限'
    }
  },

  async fetchRoutes() {
    this.setData({ loading: true, error: '', empty: false })
    try {
      const db = wx.cloud.database()
      const _ = db.command

      const res = await db.collection('routes')
        .orderBy('imported_at', 'desc')
        .limit(100)
        .get()

      const routes = res.data.map(item => {
        const id = item._id
        const name = item.name || ''
        const length_km = item.length_km || 0
        const points = item.points || []
        const source = item.source || 'unknown'

        // 复用详情页的计算逻辑
        const maxAltitudeM = this.calculateMaxAltitude(points)
        const totalAscentM = this.calculateTotalAscent(points)
        const estimatedHours = this.calculateEstimatedTime(length_km, totalAscentM)
        const difficultyTag = this.calculateDifficulty(length_km, totalAscentM, maxAltitudeM)

        return {
          id,
          name,
          length_km,
          pointCount: points.length,
          source,
          lenText: length_km > 0 ? `${length_km} km` : '--',
          altText: maxAltitudeM > 0 ? `${Math.round(maxAltitudeM)} m` : '--',
          timeText: estimatedHours > 0 ? `${estimatedHours} h` : '--',
          maxAltitudeM,
          estimatedHours,
          totalLengthKm: length_km,
          difficultyTag,
          routeKey: id
        }
      })

      this.setData({ routes, empty: routes.length === 0 })
    } catch (err) {
      console.error('Fetch routes failed:', err)
      this.setData({ error: '加载失败，请下拉重试' })
    } finally {
      this.setData({ loading: false })
    }
  },

  onPullDownRefresh() {
    this.fetchRoutes().finally(() => wx.stopPullDownRefresh())
  },

  onRouteTap(e) {
    const { id, routeKey } = e.currentTarget.dataset
    // 优先使用 objectId 作为精确标识，其次回退到 routeKey 以兼容内置示例
    const query = id ? `id=${id}` : `route=${routeKey}`
    wx.navigateTo({ url: `/pages/detail/index?${query}` })
  },

  // 分享给好友
  onShareAppMessage() {
    const { SHARE_DEFAULT_IMAGE_URL } = require('../../utils/constants.js')
    return {
      title: 'HikHike - 徒步路线列表',
      desc: '发现更多精彩的徒步路线，开启你的户外之旅',
      path: '/pages/routes/index',
      imageUrl: SHARE_DEFAULT_IMAGE_URL
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    const { SHARE_DEFAULT_IMAGE_URL } = require('../../utils/constants.js')
    return {
      title: 'HikHike - 徒步路线列表',
      query: '',
      imageUrl: SHARE_DEFAULT_IMAGE_URL
    };
  }
})


