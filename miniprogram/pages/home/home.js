const { PRODUCT_NAME } = require('../../utils/config');
const { launchTools } = require('../../utils/tools');
const { trackEvent } = require('../../utils/analytics');
const { RECENT_KEY } = require('../../utils/recent');

Page({
  data: {
    productName: PRODUCT_NAME,
    tools: launchTools,
    recent: []
  },

  onShow() {
    this.setData({ recent: wx.getStorageSync(RECENT_KEY) || [] });
    trackEvent('home_view');
  },

  openTool(event) {
    const path = event.currentTarget.dataset.path;
    const slug = event.currentTarget.dataset.slug;
    trackEvent('cta_click', { toolSlug: slug, location: 'tool_card' });
    wx.navigateTo({ url: path });
  },

  onShareAppMessage() {
    return {
      title: '手机办公文件处理助手 · 拍图识字 / PDF / 图片压缩',
      path: '/pages/home/home'
    };
  }
});
