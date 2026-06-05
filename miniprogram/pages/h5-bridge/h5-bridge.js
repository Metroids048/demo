const { buildH5ToolUrl, PRODUCT_NAME } = require('../../utils/config');
const { trackEvent } = require('../../utils/analytics');

Page({
  data: {
    productName: PRODUCT_NAME,
    toolSlug: '',
    h5Url: '',
    showWebView: false
  },

  onLoad(options) {
    const toolSlug = decodeURIComponent(options.tool || '');
    const h5Url = decodeURIComponent(options.url || buildH5ToolUrl(toolSlug));
    this.setData({
      toolSlug,
      h5Url,
      showWebView: !!h5Url
    });
    trackEvent('h5_bridge_click', { toolSlug, action: 'page_view' });
  },

  copyLink() {
    wx.setClipboardData({
      data: this.data.h5Url,
      success: () => {
        wx.showToast({ title: '链接已复制', icon: 'none' });
        trackEvent('h5_bridge_click', { toolSlug: this.data.toolSlug, action: 'copy_link' });
      }
    });
  },

  backHome() {
    wx.reLaunch({ url: '/pages/home/home' });
  }
});
