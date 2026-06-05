const { CLOUD_ENV_ID, PRODUCT_NAME } = require('./utils/config');

App({
  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({
        env: CLOUD_ENV_ID || undefined,
        traceUser: true
      });
    }
  },

  globalData: {
    productName: PRODUCT_NAME,
    defaultToolSlug: 'photo-ocr'
  }
});
