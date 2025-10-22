const AV = require('../../utils/av.js');

Page({
  data: {
    collectionId: '',
    collection: null,
    routes: [],
    loading: true,
    error: null
  },

  onLoad: function (options) {
    const id = options.id;
    if (!id) {
      this.setData({
        error: '缺少必要的参数',
        loading: false
      });
      return;
    }

    this.setData({
      collectionId: id
    });

    this.fetchCollectionData(id);
  },

  fetchCollectionData: function (id) {
    this.setData({
      loading: true,
      error: null
    });

    // 获取collection数据
    const query = new AV.Query('Collections');
    query.get(id).then((collection) => {
      const collectionData = collection.toJSON();
      this.setData({
        collection: collectionData
      });

      // 获取routeList中的路径数据
      this.fetchRouteData(collectionData.routeList);
    }).catch((error) => {
      console.error('Error fetching collection:', error);
      this.setData({
        error: '获取收藏数据失败',
        loading: false
      });
    });
  },

  fetchRouteData: function (routeIds) {
    if (!routeIds || routeIds.length === 0) {
      this.setData({
        loading: false
      });
      return;
    }

    const routeQuery = new AV.Query('KMLData');
    routeQuery.containedIn('objectId', routeIds);
    routeQuery.find().then((results) => {
      this.setData({
        routes: results.map(item => item.toJSON()),
        loading: false
      });
    }).catch((error) => {
      console.error('Error fetching routes:', error);
      this.setData({
        error: '获取路径数据失败',
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

  onRetry: function () {
    this.fetchCollectionData(this.data.collectionId);
  },

  // 分享给好友
  onShareAppMessage: function () {
    const { SHARE_DEFAULT_IMAGE_URL } = require('../../utils/constants.js');
    const { collection } = this.data;
    const shareTitle = collection ? `${collection.name} - HikHike收藏` : 'HikHike - 徒步路线收藏';
    const shareDesc = collection ? `探索${collection.name}的精彩路线` : '户外徒步路线助手，探索自然之美';
    
    return {
      title: shareTitle,
      desc: shareDesc,
      path: `/pages/collection/index?id=${this.data.collectionId}`,
      imageUrl: SHARE_DEFAULT_IMAGE_URL
    };
  },

  // 分享到朋友圈
  onShareTimeline: function () {
    const { SHARE_DEFAULT_IMAGE_URL } = require('../../utils/constants.js');
    const { collection } = this.data;
    const shareTitle = collection ? `${collection.name} - HikHike收藏` : 'HikHike - 徒步路线收藏';
    
    return {
      title: shareTitle,
      query: `id=${this.data.collectionId}`,
      imageUrl: SHARE_DEFAULT_IMAGE_URL
    };
  }
});
