# 登录和个人中心功能

## 功能说明

### 登录页面 (`pages/login/index`)
- 支持两种登录方式：
  1. **微信登录**：使用 `wx.getUserProfile` 获取用户信息
  2. **手机号登录**：输入手机号和验证码登录

### 个人中心页面 (`pages/profile/index`)
- 显示用户信息（头像、昵称）
- 显示统计数据（我的路线、收藏、关注）
- 功能列表：
  - 我的收藏
  - 我的关注
  - 我的路线
  - 关于我们
  - 联系客服
  - 退出登录

## 云函数

### 1. `login` 云函数
```javascript
// 支持两种登录类型
- type: 'wechat' // 微信登录
- type: 'phone'   // 手机号登录
```

**微信登录流程：**
1. 获取用户 openid
2. 查询 `users` 集合，判断是否已存在
3. 如果不存在，创建新用户
4. 如果存在，更新用户信息

**手机号登录流程：**
1. 验证验证码（查询 `sms_codes` 集合）
2. 检查手机号是否已绑定
3. 如果未绑定，创建新用户并关联 openid
4. 如果已绑定，更新 openid

### 2. `sendSms` 云函数
```javascript
// 发送短信验证码
- phone: 手机号
```

**流程：**
1. 验证手机号格式
2. 生成4位随机验证码
3. 保存到 `sms_codes` 集合
4. 调用短信服务商 API 发送（测试模式直接返回验证码）

## 数据库集合

### 1. `users` 集合
用户信息表
```javascript
{
  _id: "用户ID",
  openid: "微信openid",
  phone: "手机号（可选）",
  nickName: "昵称",
  avatarUrl: "头像URL",
  createTime: 1234567890,
  updateTime: 1234567890
}
```

### 2. `sms_codes` 集合
短信验证码表
```javascript
{
  _id: "验证码ID",
  phone: "手机号",
  code: "4位验证码",
  status: "unused/used", // 未使用/已使用
  createTime: 1234567890,
  updateTime: 1234567890
}
```

## 本地存储

```javascript
// openid
wx.setStorageSync('openid', openid)

// 用户信息
wx.setStorageSync('userInfo', userInfo)
```

## 配置更新

### app.json
- 添加了 `pages/login/index` 和 `pages/profile/index` 页面
- TabBar 添加了"我的"标签

## 注意事项

1. **短信服务**：`sendSms` 云函数需要接入实际的短信服务商（腾讯云、阿里云等）
2. **用户信息**：微信登录使用 `wx.getUserProfile`，需要用户主动授权
3. **数据库权限**：需要配置 `users` 和 `sms_codes` 集合的读写权限
4. **图标资源**：需要添加以下图标到 `assets/images/icons/`：
   - wechat.png（微信图标）
   - logout.png（退出图标）
   - info.png（关于图标）
   - service.png（客服图标）
   - user-s.png（用户图标-选中状态）

## 下一步

1. 部署云函数 `login` 和 `sendSms`
2. 配置数据库权限
3. 接入短信服务商
4. 添加缺失的图标资源
