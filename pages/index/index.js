// pages/index/index.js
Page({
  data: {
    hotRoutes: [
      {
        id: 1,
        title: '天目秘境·大树王国',
        description: '华东版“熊野古道”,赏千年大树奇观',
        image: 'https://lc-DNB4W2Wu.cn-n1.lcfile.com/LPAMcJCFVuHigX1JlJj5epQxBKAAVN0E/Frame%206.png'
      },
      {
        id: 2,
        title: '腾冲高黎贡山雨林徒步',
        description: '百花岭轻徒步,闯入森林秘境',
        image: 'https://lc-DNB4W2Wu.cn-n1.lcfile.com/LPAMcJCFVuHigX1JlJj5epQxBKAAVN0E/Frame%206.png'
      }
    ],
    popularSearches: [
      '▲林间穿越▲',
      '瀑布景观',
      '狗狗友好��',
      '滨海路线🌊',
      '溯溪目的地',
      '公园步道⛰️'
    ],
    hotDestinations: [
      {
        id: 1,
        name: '中国 香港',
        image: 'https://lc-DNB4W2Wu.cn-n1.lcfile.com/LPAMcJCFVuHigX1JlJj5epQxBKAAVN0E/Frame%206.png'
      },
      {
        id: 2,
        name: '中国 云南',
        image: 'https://lc-DNB4W2Wu.cn-n1.lcfile.com/LPAMcJCFVuHigX1JlJj5epQxBKAAVN0E/Frame%206.png'
      },
      {
        id: 3,
        name: '中国 新疆',
        image: 'https://lc-DNB4W2Wu.cn-n1.lcfile.com/LPAMcJCFVuHigX1JlJj5epQxBKAAVN0E/Frame%206.png'
      }
    ]
  },
  onLoad() {},
  onStart() {
    wx.navigateTo({ url: '/pages/routes/index' })
  },
  onRouteTap(e) {
    const { id } = e.currentTarget.dataset
    const query = `id=${id}`;
    wx.navigateTo({ url: `/pages/detail/index?${query}` })
  }
})
