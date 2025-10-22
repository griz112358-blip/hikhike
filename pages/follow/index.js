const AV = require("../../utils/av.js");
const { wgs84togcj02 } = require("../../utils/util.js");
const md5 = require("../../utils/md5.js");

Page({
  data: {
    latitude: 22.33,
    longitude: 114.27,
    markers: [],
    polyline: [],
    useSatellite: true,
    // HUD demo data，可后续接入真实天气
    city: "",
    temperature: 32,
    windSpeed: 7,
    humidity: 63,
    rain: 0,
    uvIndex: 2,
  },

  onReady() {
    this.mapCtx = wx.createMapContext("followMap", this);
  },

  async onLoad(options) {
    const id = options && options.id;
    const routeKey = options && options.route;
    try {
      if (id) {
        const obj = await new AV.Query("KMLData").get(id);
        await this.useGeoFromObject(obj);
      } else if (routeKey) {
        // 兼容：从本地示例加载
        const geojson = require(`../../assets/${routeKey}.js`);
        this.applyGeoJSON(geojson);
      }
      this.beginWatchLocation();
    } catch (e) {
      console.error("Load follow page data failed:", e);
      wx.showToast({ title: "加载失败", icon: "none" });
    }
  },

  async useGeoFromObject(obj) {
    const kmlContent = obj.get("kmlContent");
    let geojson = kmlContent;
    if (typeof kmlContent === "string") {
      try {
        geojson = JSON.parse(kmlContent);
      } catch (e) {}
    }
    this.applyGeoJSON(geojson);
  },

  applyGeoJSON(geojson) {
    if (!geojson || !geojson.features) return;
    const lines = geojson.features.filter((f) => f.geometry.type === "LineString");
    const coords = lines.map(line => line.geometry.coordinates);
    const gcjConvert = ([lng, lat]) => {
      const { lat: y, lon: x } = wgs84togcj02(lat, lng);
      return { latitude: y, longitude: x };
    }
    const polylineList = coords.map(i => ({ points: i.map(gcjConvert), color: "#28a745cc", width: 6 }));
    // 起终点
    const start = geojson.features.find((f) => f.id === "startPoint");
    const end = geojson.features.find((f) => f.id === "endPoint");
    const markers = [];
    if (start) {
      const [lng, lat] = start.geometry.coordinates;
      const p = wgs84togcj02(lat, lng);
      markers.push({
        id: 1,
        latitude: p.lat,
        longitude: p.lon,
        width: 20,
        height: 30,
      });
    }
    if (end) {
      const [lng, lat] = end.geometry.coordinates;
      const p = wgs84togcj02(lat, lng);
      markers.push({
        id: 2,
        latitude: p.lat,
        longitude: p.lon,
        width: 20,
        height: 30,
      });
    }

    this.setData({
      polyline: polylineList,
      markers,
    });
    // 适配视野
    setTimeout(() => {
      try {
        this.mapCtx.includePoints({
          points: polylineList.map(i => i.points).flat(),
          padding: [60, 60, 60, 60],
        });
      } catch (e) {}
    }, 0);
  },

  beginWatchLocation() {
    wx.getLocation({
      type: "wgs84",
      success: (res) => {
        const { lat, lon } = wgs84togcj02(res.latitude, res.longitude);
        this.setData({ latitude: lat, longitude: lon });
        // 逆地理 → 城市 & 天气
        this.updateCityAndWeather(lat, lon);
      },
    });
  },

  // 用腾讯位置服务逆地理（签名计算按官方文档），否则回退 open‑meteo
  updateCityAndWeather(lat, lon) {
    const qqMapKey = "FT3BZ-BNP6L-TULPJ-E6VQ4-JD346-MXBLT"; // WebServiceAPI Key
    const secretKey = "OfIi6Bfv2HtKMludUXOt2Te5xS00oU8o"; // 开启 SN 校验后的 SecretKey（SK）。若未开启可置空

    const path = "/ws/geocoder/v1";
    const params = `key=${qqMapKey}&location=${lat},${lon}`;
    // 生成签名：对原始参数按键名升序拼接 → path + '?' + rawQuery + SK → md5（小写）
    let url = `https://apis.map.qq.com${path}?${params}`;

    const sig = md5(`${path}?${params}${secretKey}`);
    url += `&sig=${sig}`;

    wx.request({
      url,
      success: (r) => {
        const city =
          r.data &&
          r.data.result &&
          r.data.result.address_component &&
          r.data.result.address_component.city;
        const district =
          r.data &&
          r.data.result &&
          r.data.result.address_component &&
          r.data.result.address_component.district;
        if (city) this.setData({ city: `${city} ${district}` });
      },
    });

    this.fetchWeather(lat, lon);
  },

  fetchWeather(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,uv_index&timezone=auto`;
    wx.request({
      url,
      success: (res) => {
        const c = res.data && res.data.current;
        if (!c) return;
        this.setData({
          temperature: Math.round(c.temperature_2m),
          humidity: c.relative_humidity_2m,
          rain: c.precipitation || 0,
          windSpeed: c.wind_speed_10m,
          uvIndex: c.uv_index || 0,
        });
      },
    });
  },

  onBackTap() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack({ delta: 1 });
    } else {
      wx.switchTab({ url: '/pages/index/index' });
    }
  },

  onStartRecord() {
    // 地图移动到当前定位中心
    if (this.mapCtx && typeof this.mapCtx.moveToLocation === "function") {
      try {
        this.mapCtx.moveToLocation({
          latitude: this.data.latitude,
          longitude: this.data.longitude,
        });
      } catch (e) {}
    } else {
      this.setData({
        latitude: this.data.latitude,
        longitude: this.data.longitude,
      });
    }
    wx.showToast({ title: "开始记录", icon: "none" });
  },

  // 分享给好友
  onShareAppMessage() {
    const { SHARE_DEFAULT_IMAGE_URL } = require('../../utils/constants.js');
    return {
      title: 'HikHike - 开始徒步记录',
      desc: '记录你的徒步之旅，分享美好时光',
      path: '/pages/follow/index',
      imageUrl: SHARE_DEFAULT_IMAGE_URL
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    const { SHARE_DEFAULT_IMAGE_URL } = require('../../utils/constants.js');
    return {
      title: 'HikHike - 开始徒步记录',
      query: '',
      imageUrl: SHARE_DEFAULT_IMAGE_URL
    };
  }
});
