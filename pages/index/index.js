// pages/index/index.js
const AV = require('../../utils/av.js');

Page({
  data: {
    searchText: '',
    popularSearches: [],
  },
  
  onLoad() {
    this.fetchPopularSearches();
  },
  
  fetchPopularSearches() {
    const query = new AV.Query('Collections');
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
    const { name } = e.currentTarget.dataset;
    if (name) {
      wx.navigateTo({
        url: `/pages/search_results/index?keyword=${encodeURIComponent(name)}`
      });
    }
  },
  
  onCollectionTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/collection/index?id=${id}`
    });
  },

  // 分享给好友
  onShareAppMessage() {
    const { SHARE_DEFAULT_IMAGE_URL } = require('../../utils/constants.js');
    return {
      title: 'HikHike - 户外徒步路线助手',
      desc: '专业的徒步路线分享平台，探索自然之美',
      path: '/pages/index/index',
      imageUrl: SHARE_DEFAULT_IMAGE_URL
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    const { SHARE_DEFAULT_IMAGE_URL } = require('../../utils/constants.js');
    return {
      title: 'HikHike - 户外徒步路线助手',
      query: '',
      imageUrl: SHARE_DEFAULT_IMAGE_URL
    };
  }
})