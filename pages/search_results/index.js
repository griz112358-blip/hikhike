const AV = require('../../utils/av.js');

Page({
  data: {
    keyword: '',
    searchResults: [],
    loading: true, // 添加 loading 状态
  },
  onLoad: function (options) {
    this.setData({
      keyword: options.keyword || ''
    });
    if (this.data.keyword) {
      this.fetchSearchResults(this.data.keyword);
    } else {
      this.setData({
        loading: false // 如果没有关键字，直接设置 loading 为 false
      });
    }
  },
  fetchSearchResults: function (keyword) {
    this.setData({
      loading: true
    });
    const query = new AV.Query('KMLData');
    query.contains('routeName', keyword); // 假设KMLData表中有一个name字段用于搜索，与WXML中的item.name对应
    query.find().then((results) => {
      this.setData({
        searchResults: results.map(item => item.toJSON()),
        loading: false
      });
    }).catch((error) => {
      console.error('Error fetching search results:', error);
      this.setData({
        loading: false
      });
    });
  },
  onRouteTap: function (event) {
    const id = event.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/detail/index?id=' + id
    });
  },

  // 分享给好友
  onShareAppMessage: function () {
    const { SHARE_DEFAULT_IMAGE_URL } = require('../../utils/constants.js');
    const { keyword } = this.data;
    const shareTitle = keyword ? `"${keyword}"的搜索结果 - HikHike` : 'HikHike - 搜索结果';
    const shareDesc = keyword ? `搜索"${keyword}"找到的精彩路线` : '发现更多精彩的徒步路线';
    
    return {
      title: shareTitle,
      desc: shareDesc,
      path: `/pages/search_results/index?keyword=${keyword}`,
      imageUrl: SHARE_DEFAULT_IMAGE_URL
    };
  },

  // 分享到朋友圈
  onShareTimeline: function () {
    const { SHARE_DEFAULT_IMAGE_URL } = require('../../utils/constants.js');
    const { keyword } = this.data;
    const shareTitle = keyword ? `"${keyword}"的搜索结果 - HikHike` : 'HikHike - 搜索结果';
    
    return {
      title: shareTitle,
      query: `keyword=${keyword}`,
      imageUrl: SHARE_DEFAULT_IMAGE_URL
    };
  }
});
