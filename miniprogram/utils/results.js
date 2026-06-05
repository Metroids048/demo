const RESULT_PREFIX = 'office-tools.result.';

function saveResult(payload) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  wx.setStorageSync(`${RESULT_PREFIX}${id}`, {
    id,
    createdAt: new Date().toISOString(),
    ...payload
  });
  return id;
}

function getResult(id) {
  if (!id) return null;
  return wx.getStorageSync(`${RESULT_PREFIX}${id}`) || null;
}

function openResult(payload) {
  const resultId = saveResult(payload);
  wx.navigateTo({ url: `/pages/result/result?resultId=${encodeURIComponent(resultId)}` });
}

module.exports = {
  RESULT_PREFIX,
  saveResult,
  getResult,
  openResult
};
