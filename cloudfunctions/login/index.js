// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

/**
 * 登录云函数
 * 支持微信登录和手机号登录
 */
exports.main = async (event, context) => {
  const { type, userInfo, phone, code } = event
  const wxContext = cloud.getWXContext()

  try {
    if (type === 'wechat') {
      // 微信登录
      const openid = wxContext.OPENID

      // 查询用户是否已存在
      const userRes = await db.collection('users').where({
        openid
      }).get()

      let userData

      if (userRes.data.length === 0) {
        // 新用户，创建用户记录
        const createTime = new Date().getTime()
        userData = {
          openid,
          nickName: userInfo?.nickName || '户外爱好者',
          avatarUrl: userInfo?.avatarUrl || '',
          createTime,
          updateTime: createTime
        }
        await db.collection('users').add({
          data: userData
        })
      } else {
        // 已有用户，更新用户信息
        userData = userRes.data[0]
        if (userInfo?.nickName || userInfo?.avatarUrl) {
          await db.collection('users').doc(userData._id).update({
            data: {
              nickName: userInfo?.nickName || userData.nickName,
              avatarUrl: userInfo?.avatarUrl || userData.avatarUrl,
              updateTime: new Date().getTime()
            }
          })
          userData.nickName = userInfo?.nickName || userData.nickName
          userData.avatarUrl = userInfo?.avatarUrl || userData.avatarUrl
        }
      }

      return {
        success: true,
        data: {
          openid,
          userInfo: userData
        }
      }

    } else if (type === 'phone') {
      // 手机号登录
      if (!phone || !code) {
        return {
          success: false,
          error: '手机号和验证码不能为空'
        }
      }

      // 验证验证码（实际项目中应该验证发送的验证码）
      const codeRes = await db.collection('sms_codes').where({
        phone,
        code,
        status: 'unused'
      }).orderBy('createTime', 'desc').limit(1).get()

      if (codeRes.data.length === 0) {
        return {
          success: false,
          error: '验证码错误或已过期'
        }
      }

      // 检查验证码是否过期（5分钟）
      const codeData = codeRes.data[0]
      const now = new Date().getTime()
      if (now - codeData.createTime > 5 * 60 * 1000) {
        return {
          success: false,
          error: '验证码已过期'
        }
      }

      // 标记验证码为已使用
      await db.collection('sms_codes').doc(codeData._id).update({
        data: {
          status: 'used',
          updateTime: now
        }
      })

      // 查询手机号是否已绑定
      const userRes = await db.collection('users').where({
        phone
      }).get()

      let userData
      let openid

      if (userRes.data.length === 0) {
        // 新用户，使用 openid 创建
        openid = wxContext.OPENID
        const createTime = now
        userData = {
          openid,
          phone,
          nickName: '户外爱好者',
          avatarUrl: '',
          createTime,
          updateTime: createTime
        }
        await db.collection('users').add({
          data: userData
        })
      } else {
        // 已有用户，更新 openid
        userData = userRes.data[0]
        openid = userData.openid
        await db.collection('users').doc(userData._id).update({
          data: {
            openid: wxContext.OPENID,
            updateTime: now
          }
        })
      }

      return {
        success: true,
        data: {
          openid,
          userInfo: userData
        }
      }

    } else {
      return {
        success: false,
        error: '不支持的登录类型'
      }
    }
  } catch (err) {
    console.error('登录失败:', err)
    return {
      success: false,
      error: err.message || '登录失败'
    }
  }
}
