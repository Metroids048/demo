const RECENT_KEY = 'office-tools.recent';

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${Number.isInteger(value) ? value : value.toFixed(1)} ${units[exponent]}`;
}

function remember(tool, name, meta = {}) {
  const recent = [
    {
      id: `${Date.now()}`,
      tool,
      name,
      ...meta
    },
    ...(wx.getStorageSync(RECENT_KEY) || [])
  ].slice(0, 5);
  wx.setStorageSync(RECENT_KEY, recent);
  return recent;
}

module.exports = {
  RECENT_KEY,
  formatBytes,
  remember
};
