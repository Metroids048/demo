const { normalizeError } = require('./errors');

function ensureCloudReady() {
  if (!wx.cloud) {
    throw { errorCode: 'CLOUD_NOT_AVAILABLE' };
  }
}

function getFileName(filePath, fallback = 'file') {
  const parts = String(filePath || '').split(/[\\/]/);
  return parts[parts.length - 1] || fallback;
}

function uploadLocalFile(filePath, directory) {
  ensureCloudReady();
  const safeName = getFileName(filePath).replace(/[^\w.-]/g, '_');
  const cloudPath = `${directory}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;

  return new Promise((resolve, reject) => {
    wx.cloud.uploadFile({
      cloudPath,
      filePath,
      success: (response) => resolve(response.fileID),
      fail: (error) => reject({ ...normalizeError(error), errorCode: 'UPLOAD_FAILED' })
    });
  });
}

function callCloudFunction(name, data) {
  ensureCloudReady();
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name,
      data,
      success: (response) => {
        const result = response.result || {};
        if (result.ok === false) {
          reject(normalizeError(result));
          return;
        }
        resolve(result);
      },
      fail: (error) => reject(normalizeError(error))
    });
  });
}

function downloadCloudFile(fileID) {
  ensureCloudReady();
  return new Promise((resolve, reject) => {
    wx.cloud.downloadFile({
      fileID,
      success: (response) => resolve(response.tempFilePath),
      fail: (error) => reject(normalizeError(error))
    });
  });
}

module.exports = {
  uploadLocalFile,
  callCloudFunction,
  downloadCloudFile
};
