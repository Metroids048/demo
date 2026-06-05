const ANALYTICS_KEY = 'office-tools.analytics';

function trackEvent(name, properties = {}) {
  const event = {
    name,
    createdAt: new Date().toISOString(),
    properties: {
      ...properties,
      channel: properties.channel || 'mini-program',
      isMiniProgram: true
    }
  };

  try {
    const current = wx.getStorageSync(ANALYTICS_KEY) || [];
    wx.setStorageSync(ANALYTICS_KEY, [event, ...current].slice(0, 200));
  } catch (error) {
    console.warn('analytics write failed', error);
  }

  return event;
}

function exportEvents() {
  return wx.getStorageSync(ANALYTICS_KEY) || [];
}

module.exports = {
  ANALYTICS_KEY,
  trackEvent,
  exportEvents
};
