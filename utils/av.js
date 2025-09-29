// LeanCloud initialization for WeChat Mini Program
const AV = require("../libs/av-core-min.js");
const adapters = require("../libs/leancloud-adapters-weapp.js");

AV.setAdapters(adapters);

AV.init({
  appId: 'DNB4W2WuL1wYvLLnbGloEieU-gzGzoHsz',
  appKey: 'LyLyOlqAPW28l20jlVdXIuuP',
  // 如有自定义域名或控制台提供的 Server URL，请在此添加 serverURL 字段
  serverURL: 'https://dnb4w2wu.lc-cn-n1-shared.com'
})

module.exports = AV


