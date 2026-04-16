// pages/profile/index.js
Page({
  data: {
    isLoggedIn: false,
    userInfo: null,
    stats: {
      routes: 0,
      collections: 0,
      follows: 0
    },
    loading: true
  },

  onLoad() {
    this.checkLoginStatus();
  },

  onShow() {
    // 每次显示页面时刷新数据
    if (this.data.isLoggedIn) {
      this.loadUserData();
    }
  },

  // 检查登录状态
  checkLoginStatus() {
    const openid = wx.getStorageSync('openid');
    const userInfo = wx.getStorageSync('userInfo');

    if (openid && userInfo) {
      this.setData({ 
        isLoggedIn: true, 
        userInfo: userInfo,
        loading: false
      });
      this.loadUserData();
    } else {
      this.setData({ loading: false });
    }
  },

  // 加载用户数据
  loadUserData() {
    const db = wx.cloud.database();
    const _ = db.command;
    const openid = wx.getStorageSync('openid');

    Promise.all([
      // 加载收藏数量
      db.collection('collections')
        .where({ openid })
        .count()
        .then(res => res.total || 0),

      // 加载关注数量
      db.collection('follows')
        .where({ openid })
        .count()
        .then(res => res.total || 0),

      // 加载用户收藏的路线（计算总路线数）
      db.collection('collections')
        .where({ openid })
        .get()
        .then(res => {
          const routeIds = [...new Set(res.data.map(item => item.routeId))];
          return routeIds.length;
        })
    ]).then(([collections, follows, routes]) => {
      this.setData({
        'stats.collections': collections,
        'stats.follows': follows,
        'stats.routes': routes
      });
    }).catch(err => {
      console.error('加载用户数据失败:', err);
    });
  },

  // 跳转到收藏页
  onCollections() {
    if (!this.data.isLoggedIn) {
      this.goToLogin();
      return;
    }
    wx.switchTab({
      url: '/pages/collection/index'
    });
  },

  // 跳转到关注页
  onFollows() {
    if (!this.data.isLoggedIn) {
      this.goToLogin();
      return;
    }
    wx.navigateTo({
      url: '/pages/follow/index'
    });
  },

  // 跳转到我的路线
  onMyRoutes() {
    if (!this.data.isLoggedIn) {
      this.goToLogin();
      return;
    }
    wx.navigateTo({
      url: '/pages/routes/index?type=my'
    });
  },

  // 跳转到登录页
  goToLogin() {
    wx.navigateTo({
      url: '/pages/login/index'
    });
  },

  // 退出登录
  onLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除本地存储
          wx.removeStorageSync('openid');
          wx.removeStorageSync('userInfo');

          this.setData({
            isLoggedIn: false,
            userInfo: null,
            stats: {
              routes: 0,
              collections: 0,
              follows: 0
            }
          });

          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  },

  // 关于
  onAbout() {
    wx.showModal({
      title: '关于 HikHike',
      content: 'HikHike 是一款专为户外爱好者设计的徒步路线探索应用。我们致力于为您提供最优质的户外路线资源。',
      showCancel: false
    });
  },

  // 联系客服
  onContact() {
    wx.showModal({
      title: '联系客服',
      content: '如需帮助，请添加客服微信：hikhike_support',
      showCancel: false
    });
  },

  // 分享给好友
  onShareAppMessage() {
    const { SHARE_DEFAULT_IMAGE_URL } = require('../../utils/constants.js');
    return {
      title: 'HikHike - 探索户外路线',
      desc: '发现更多精彩的徒步路线，开启你的户外之旅',
      path: '/pages/index/index',
      imageUrl: SHARE_DEFAULT_IMAGE_URL
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    const { SHARE_DEFAULT_IMAGE_URL } = require('../../utils/constants.js');
    return {
      title: 'HikHike - 探索户外路线',
      query: '',
      imageUrl: SHARE_DEFAULT_IMAGE_URL
    };
  }
});
