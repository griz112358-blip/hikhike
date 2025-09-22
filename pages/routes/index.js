// pages/routes/index.js
Page({
  data: {
    routes: [
      { id: 'path1', name: '示例线路 1', desc: '从起点到终点的示例路线' }
    ]
  },

  onRouteTap(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/detail/index?route=${id}` })
  }
})


