const AV = require('../../utils/av.js');

Page({
    data: {
        clubs: []
    },

    onLoad: function () {
        this.getClubs();
    },

    getClubs: function () {
        const query = new AV.Query('Clubs');
        query.find().then(clubs => {
            this.setData({
                clubs: clubs.map(club => club.toJSON())
            });
            
        }).catch(console.error);
    },

    makePhoneCall: function (e) {
        const phoneNumber = e.currentTarget.dataset.phonenumber;
        if (phoneNumber) {
            wx.makePhoneCall({
                phoneNumber: phoneNumber
            });
        }
    },

    copyWechatId: function (e) {
        const wechatId = e.currentTarget.dataset.wechatid;
        if (wechatId) {
            wx.setClipboardData({
                data: wechatId,
                success: function () {
                    wx.showToast({
                        title: '微信号已复制',
                        icon: 'success',
                        duration: 2000
                    });
                }
            });
        }
    },

    goToMiniProgram: function (e) {
        const shortLink = e.currentTarget.dataset.shortlink;
        if (shortLink) {
            console.log('尝试跳转小程序，使用的 shortLink:', shortLink);
            wx.navigateToMiniProgram({
                shortLink: shortLink,
                success(res) {
                    console.log('跳转成功', res);
                },
                fail(err) {
                    console.error('跳转失败', err);
                    wx.showToast({
                        title: '小程序跳转失败，请确保短链正确且已关联',
                        icon: 'none',
                        duration: 2000
                    });
                }
            });
        } else {
            wx.showToast({
                title: '小程序短链为空',
                icon: 'none',
                duration: 2000
            });
        }
    },

    copyContactWechatId: function () {
        const contactWechatId = 'Reykjavik2024';
        wx.setClipboardData({
            data: contactWechatId,
            success: function () {
                wx.showToast({
                    title: '微信号已复制',
                    icon: 'success',
                    duration: 2000
                });
            }
        });
    }
});
