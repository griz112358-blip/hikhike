Page({
  data: {
    keyword: '',
    searchResults: [],
    loading: true,
  },
  onLoad: function (options) {
    this.setData({
      keyword: decodeURIComponent(options.keyword || '')
    });
    if (this.data.keyword) {
      this.fetchSearchResults(this.data.keyword);
    } else {
      this.setData({
        loading: false
      });
    }
  },
  fetchSearchResults: function (keyword) {
    this.setData({
      loading: true
    });

    const db = wx.cloud.database();
    const _ = db.command;

    db.collection('routes')
      .where({
        name: db.RegExp({
          regexp: keyword,
          options: 'i'
        })
      })
      .orderBy('imported_at', 'desc')
      .limit(50)
      .get()
      .then(res => {
        const results = res.data.map(item => {
          // 计算最高海拔
          const points = item.points || [];
          const elevations = points.map(p => p[2] || 0).filter(e => e > 0);
          const maxAltitudeM = elevations.length > 0 ? Math.max(...elevations) : 0;

          // 计算累计爬升
          let totalAscent = 0;
          if (points.length >= 2) {
            for (let i = 1; i < points.length; i++) {
              const prevElev = points[i - 1][2] || 0;
              const currElev = points[i][2] || 0;
              if (currElev > prevElev) {
                totalAscent = Math.round((totalAscent + (currElev - prevElev)) * 100) / 100;
              }
            }
          }

          // 计算预估时间
          const length_km = item.length_km || 0;
          const timeFromDistance = parseFloat((length_km / 3).toFixed(2));
          const timeFromAscent = parseFloat(((totalAscent / 100) * 5 / 60).toFixed(2));
          const estimatedHours = parseFloat((timeFromDistance + timeFromAscent).toFixed(1));

          return {
            objectId: item._id,
            routeName: item.name,
            totalLengthKm: length_km,
            estimatedHours: estimatedHours,
            maxAltitudeM: maxAltitudeM
          };
        });

        this.setData({
          searchResults: results,
          loading: false
        });
      })
      .catch(error => {
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
