const { buildH5ToolUrl } = require('../../utils/config');
const { trackEvent } = require('../../utils/analytics');

function openH5Tool(toolSlug, extraQuery = {}) {
  const url = buildH5ToolUrl(toolSlug, extraQuery);
  trackEvent('h5_bridge_click', { toolSlug, action: 'open_webview' });
  wx.navigateTo({
    url: `/pages/h5-bridge/h5-bridge?tool=${encodeURIComponent(toolSlug)}&url=${encodeURIComponent(url)}`
  });
}

function copyH5Link(toolSlug, extraQuery = {}) {
  const url = buildH5ToolUrl(toolSlug, extraQuery);
  trackEvent('h5_bridge_click', { toolSlug, action: 'copy_link' });
  wx.setClipboardData({
    data: url,
    success: () => {
      wx.showToast({ title: 'H5 链接已复制', icon: 'none' });
    }
  });
}

function promptOpenSettings(message) {
  wx.showModal({
    title: '需要授权',
    content: message,
    confirmText: '去设置',
    success: (response) => {
      if (response.confirm) {
        wx.openSetting({});
      }
    }
  });
}

module.exports = {
  openH5Tool,
  copyH5Link,
  promptOpenSettings
};
