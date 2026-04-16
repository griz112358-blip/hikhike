// pages/login/index.js
Page({
  data: {
    activeTab: 'wechat', // 'wechat' 或 'phone'
    loading: false,
    phone: '',
    code: '',
    countdown: 0,
    countdownTimer: null
  },

  onLoad() {
    // 检查是否已登录
    this.checkLoginStatus();
  },

  onUnload() {
    // 清除定时器
    if (this.data.countdownTimer) {
      clearInterval(this.data.countdownTimer);
    }
  },

  // 切换登录方式
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
  },

  // 微信登录
  onWeChatLogin() {
    if (this.data.loading) return;

    this.setData({ loading: true });

    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (profileRes) => {
        wx.cloud.callFunction({
          name: 'login',
          data: {
            type: 'wechat',
            userInfo: profileRes.userInfo
          }
        }).then(res => {
          const { openid, userInfo } = res.result.data;
          
          // 保存用户信息到本地存储
          wx.setStorageSync('openid', openid);
          wx.setStorageSync('userInfo', userInfo);
          
          wx.showToast({
            title: '登录成功',
            icon: 'success'
          });

          // 延迟跳转到个人中心
          setTimeout(() => {
            wx.switchTab({
              url: '/pages/profile/index'
            });
          }, 1500);
        }).catch(err => {
          console.error('微信登录失败:', err);
          wx.showToast({
            title: '登录失败，请重试',
            icon: 'none'
          });
        }).finally(() => {
          this.setData({ loading: false });
        });
      },
      fail: (err) => {
        console.error('获取用户信息失败:', err);
        this.setData({ loading: false });
        wx.showToast({
          title: '需要授权才能登录',
          icon: 'none'
        });
      }
    });
  },

  // 手机号输入
  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  // 验证码输入
  onCodeInput(e) {
    this.setData({ code: e.detail.value });
  },

  // 获取验证码
  onGetCode() {
    const phone = this.data.phone;
    
    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      });
      return;
    }

    if (this.data.countdown > 0) {
      return;
    }

    this.setData({ loading: true });

    wx.cloud.callFunction({
      name: 'sendSms',
      data: {
        phone: phone
      }
    }).then(res => {
      wx.showToast({
        title: '验证码已发送',
        icon: 'success'
      });

      // 开始倒计时
      this.startCountdown();
    }).catch(err => {
      console.error('发送验证码失败:', err);
      wx.showToast({
        title: '发送失败，请重试',
        icon: 'none'
      });
    }).finally(() => {
      this.setData({ loading: false });
    });
  },

  // 开始倒计时
  startCountdown() {
    this.setData({ countdown: 60 });

    const timer = setInterval(() => {
      const countdown = this.data.countdown - 1;
      
      if (countdown <= 0) {
        clearInterval(timer);
        this.setData({ countdown: 0, countdownTimer: null });
      } else {
        this.setData({ countdown });
      }
    }, 1000);

    this.setData({ countdownTimer: timer });
  },

  // 手机号登录
  onPhoneLogin() {
    const { phone, code } = this.data;

    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      });
      return;
    }

    // 验证验证码
    if (!code || code.length !== 4) {
      wx.showToast({
        title: '请输入正确的验证码',
        icon: 'none'
      });
      return;
    }

    this.setData({ loading: true });

    wx.cloud.callFunction({
      name: 'login',
      data: {
        type: 'phone',
        phone: phone,
        code: code
      }
    }).then(res => {
      const { openid, userInfo } = res.result.data;
      
      // 保存用户信息到本地存储
      wx.setStorageSync('openid', openid);
      wx.setStorageSync('userInfo', userInfo);
      
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });

      // 延迟跳转到个人中心
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/profile/index'
        });
      }, 1500);
    }).catch(err => {
      console.error('手机号登录失败:', err);
      wx.showToast({
        title: '登录失败，请重试',
        icon: 'none'
      });
    }).finally(() => {
      this.setData({ loading: false });
    });
  },

  // 检查登录状态
  checkLoginStatus() {
    const openid = wx.getStorageSync('openid');
    if (openid) {
      // 已登录，跳转到个人中心
      wx.switchTab({
        url: '/pages/profile/index'
      });
    }
  }
});
