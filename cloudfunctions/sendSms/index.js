// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

/**
 * 发送短信验证码
 * 注意：实际项目中需要接入短信服务商，如腾讯云、阿里云等
 * 这里只是模拟实现
 */
exports.main = async (event, context) => {
  const { phone } = event

  if (!phone) {
    return {
      success: false,
      error: '手机号不能为空'
    }
  }

  // 验证手机号格式
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    return {
      success: false,
      error: '手机号格式不正确'
    }
  }

  try {
    // 生成4位随机验证码
    const code = Math.floor(1000 + Math.random() * 9000).toString()
    const now = new Date().getTime()

    // 保存验证码到数据库
    await db.collection('sms_codes').add({
      data: {
        phone,
        code,
        status: 'unused',
        createTime: now,
        updateTime: now
      }
    })

    // 实际项目中这里应该调用短信服务商的API发送短信
    // 这里只是返回验证码用于测试
    console.log(`发送验证码到 ${phone}: ${code}`)

    return {
      success: true,
      message: '验证码已发送',
      // 测试模式下返回验证码
      data: {
        code
      }
    }
  } catch (err) {
    console.error('发送验证码失败:', err)
    return {
      success: false,
      error: err.message || '发送失败'
    }
  }
}
