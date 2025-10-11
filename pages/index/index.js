// pages/index/index.js
const AV = require('../../utils/av.js');

Page({
  data: {
    searchText: '',
    hotRoutes: [
      {
        id: 1,
        title: '天目秘境·大树王国',
        description: '华东版"熊野古道",赏千年大树奇观',
        image: 'https://lc-DNB4W2Wu.cn-n1.lcfile.com/LPAMcJCFVuHigX1JlJj5epQxBKAAVN0E/Frame%206.png'
      },
      {
        id: 2,
        title: '腾冲高黎贡山雨林徒步',
        description: '百花岭轻徒步,闯入森林秘境',
        image: 'https://lc-DNB4W2Wu.cn-n1.lcfile.com/LPAMcJCFVuHigX1JlJj5epQxBKAAVN0E/Frame%206.png'
      }
    ],
    popularSearches: [],
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
  
  onLoad() {
    this.fetchPopularSearches();
  },
  
  fetchPopularSearches() {
    const query = new AV.Query('Collections');
    query.limit(6); // 限制获取6个收藏
    query.find().then((results) => {
      this.setData({
        popularSearches: results.map(item => ({
          id: item.id,
          name: item.get('name'),
          objectId: item.id
        }))
      });
    }).catch((error) => {
      console.error('Error fetching popular searches:', error);
    });
  },
  
  onSearchInput(e) {
    this.setData({
      searchText: e.detail.value
    });
  },
  
  onSearchTap() {
    if (this.data.searchText) {
      wx.navigateTo({
        url: '/pages/search_results/index?keyword=' + this.data.searchText
      });
    }
  },
  
  onStart() {
    wx.navigateTo({ url: '/pages/routes/index' })
  },
  
  onRouteTap(e) {
    const { id } = e.currentTarget.dataset
    const query = `id=${id}`;
    wx.navigateTo({ url: `/pages/detail/index?${query}` })
  },
  
  onCollectionTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/collection/index?id=${id}`
    });
  }
})