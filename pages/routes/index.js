// pages/routes/index.js
const AV = require('../../utils/av.js')

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

  async fetchRoutes() {
    this.setData({ loading: true, error: '', empty: false })
    try {
      const query = new AV.Query('KMLData')
      query.ascending('order')
      const results = await query.find()
      const toNumber = (val) => {
        if (typeof val === 'number') return Number.isFinite(val) ? val : null
        if (typeof val === 'string') {
          const n = parseFloat(val)
          return Number.isFinite(n) ? n : null
        }
        return null
      }
      const routes = results.map(obj => {
        const id = obj.get('objectId')
        const name = obj.get('routeName')
        const maxAltitudeM = obj.get('maxAltitudeM')
        const estimatedHours = obj.get('estimatedHours')
        const totalLengthKm = obj.get('totalLengthKm')
        const routeKey = obj.get('routeKey') || id
        const lenText = totalLengthKm !== null ? `${totalLengthKm} km` : '--'
        const timeText = estimatedHours !== null ? `${estimatedHours} h` : '--'
        const altText = maxAltitudeM !== null ? `${maxAltitudeM} m` : '--'
        return {
          id,
          routeKey,
          name,
          maxAltitudeM,
          estimatedHours,
          totalLengthKm,
          lenText,
          timeText,
          altText
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
  }
})


