// 配置文件
module.exports = {
  // 云函数URL配置
  cloudFunction: {
    // 微信小程序云函数HTTP API URL
    // 格式: https://<env-id>.api.tcloudbasegateway.com/v1/functions/<function-name>
    url: 'https://cloud1-1g6k23o45e657c65.api.tcloudbasegateway.com/v1/functions/saveRoute',
    timeout: 30000 // 30秒超时
  },

  // 云开发访问令牌（Access Token）
  // 获取方式：
  // 1. 访问 https://console.cloud.tencent.com/tcb/env
  // 2. 选择你的环境
  // 3. 在左侧菜单找到"云开发配置"或"访问管理"
  // 4. 获取或创建访问令牌
  // 5. 将token粘贴到下面
  accessToken: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjlkMWRjMzFlLWI0ZDAtNDQ4Yi1hNzZmLWIwY2M2M2Q4MTQ5OCJ9.eyJhdWQiOiJjbG91ZDEtMWc2azIzbzQ1ZTY1N2M2NSIsImV4cCI6MjUzNDAyMzAwNzk5LCJpYXQiOjE3NzYwNjkyMjgsImF0X2hhc2giOiJPTVlIT0Jvd1FzV0RJNGlSdXlsTXB3IiwicHJvamVjdF9pZCI6ImNsb3VkMS0xZzZrMjNvNDVlNjU3YzY1IiwibWV0YSI6eyJwbGF0Zm9ybSI6IkFwaUtleSJ9LCJhZG1pbmlzdHJhdG9yX2lkIjoiMjA0MjIxODQ1NDQyOTcxNjQ4MSIsInVzZXJfdHlwZSI6IiIsImNsaWVudF90eXBlIjoiY2xpZW50X3NlcnZlciIsImlzX3N5c3RlbV9hZG1pbiI6dHJ1ZX0.CyferxkJF3bpFW4UYoSdsIWa--n3NAJZCQscL4JX8aayrC8UHBByKMlXp2JKlObar9DJiro4qfRWkUgEAhu0Df3Q56rMeQlEqACGhDRUs47WvJ1yaFiwccb7fXN46r1fBf_ADaTa25XHYG5QWbOr-Hqwcxt3-bb3TN7DN02F5mBtSj2djr-4HsQU9jsGKNzk3kgV5fweXjHKBp0k7nmZOqSg42nnLsPVJIOe0YSOw-rZPuJ0xkcxc2yZPxVOZmMJDp8sBMiFsl-vTMcIVTbBfIaGikD8h1lwgAXCimdm_a_lW0PKOdi_d9DIloGP3OsT6fU128htizQtrGfKFZG4ww',

  
  // KML文件目录（相对于脚本位置）
  kmlDirectory: './kml_files',
  
  // 数据来源选项
  sources: {
    '1': '2bulu',
    '2': 'wikiloc',
    '3': 'waymarked',
    '4': 'overpass'
  },
  
  // 文件名编码修复映射表
  //
  // 说明：
  // 1. 大部分编码问题会优先使用 iconv-lite 进行GBK/UTF-8转换
  // 2. 此映射表用于处理一些iconv无法修复的特殊乱码情况
  // 3. 常见场景：
  //    - 文件名已经被多次错误转换，导致原始编码信息丢失
  //    - 某些特殊字符在转换过程中被损坏
  //    - 需要精确控制某些特定乱码的修复
  //
  // 使用建议：
  // - 优先让iconv自动处理
  // - 只有在iconv无法修复时，才手动添加映射
  // - 可以根据实际遇到的乱码情况动态添加
  encodingFixes: {
    'ÙÜÉ½': '庐山',
    'Ä¾·½': '木方',
    'ÌýÒô': '听音',
    'Î÷ºþ': '西湖',
    'Ëþ°®': '泰爱',
    'µº': '岛',
    '½­': '江',
    'ºþ': '湖',
    'É½': '山',
    'Ë®': '水',
    'Â·': '路',
    '½­ËÕ': '江苏',
    'Õã½­': '浙江',
    'ÉÏº£': '上海',
    '±±¾©': '北京',
    '¹ã¶«': '广东',
    'ËÄ´¨': '四川',
    'ÄÏ¾©': '南京',
    'Î÷°²': '西安',
    '³É¶¼': '成都',
    'ºþÄÏ': '湖南',
    'º×ÖÝ': '湖北',
    'ÉÏº£': '上海',
    'ÄÏ¾©': '南京'
  },
  
  // 日志级别: 'debug', 'info', 'warn', 'error'
  logLevel: 'info'
};
