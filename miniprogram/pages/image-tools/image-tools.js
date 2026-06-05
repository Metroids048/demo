const { TOOL_SLUGS } = require('../../utils/config');
const { trackEvent } = require('../../utils/analytics');
const { formatBytes, remember } = require('../../utils/recent');
const { openResult } = require('../../utils/results');

function savedRate(original, output) {
  if (!original || output >= original) return 0;
  return Math.round(((original - output) / original) * 100);
}

Page({
  data: {
    sourcePath: '',
    sourceSize: 0,
    sourceSizeLabel: '',
    quality: 80,
    maxWidth: 1600,
    canvasWidth: 1,
    canvasHeight: 1,
    isProcessing: false,
    error: ''
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (response) => {
        const file = response.tempFiles[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
          this.setData({ error: '图片需小于 10MB，避免手机端卡顿。' });
          trackEvent('process_fail', { toolSlug: TOOL_SLUGS.imageTools, reason: 'file_too_large' });
          return;
        }
        this.setData({
          sourcePath: file.tempFilePath,
          sourceSize: file.size,
          sourceSizeLabel: formatBytes(file.size),
          error: ''
        });
        trackEvent('input_ready', { toolSlug: TOOL_SLUGS.imageTools, inputType: 'image', fileSize: file.size });
      }
    });
  },

  changeQuality(event) {
    this.setData({ quality: event.detail.value });
  },

  changeMaxWidth(event) {
    this.setData({ maxWidth: event.detail.value });
  },

  compressImage() {
    if (!this.data.sourcePath) {
      this.setData({ error: '请先选择图片。' });
      return;
    }

    this.setData({ isProcessing: true, error: '' });
    trackEvent('process_start', {
      toolSlug: TOOL_SLUGS.imageTools,
      inputType: 'image',
      outputType: 'image',
      quality: this.data.quality,
      maxWidth: this.data.maxWidth
    });

    wx.getImageInfo({
      src: this.data.sourcePath,
      success: (info) => this.createImageResult(info),
      fail: () => {
        this.setData({ isProcessing: false, error: '图片读取失败，请换一张图片重试。' });
      }
    });
  },

  createImageResult(info) {
    const scale = Math.min(1, this.data.maxWidth / info.width);
    if (scale >= 1) {
      this.compressOnly();
      return;
    }

    const targetWidth = Math.max(1, Math.round(info.width * scale));
    const targetHeight = Math.max(1, Math.round(info.height * scale));
    this.setData({ canvasWidth: targetWidth, canvasHeight: targetHeight });

    const context = wx.createCanvasContext('resizeCanvas', this);
    context.drawImage(info.path, 0, 0, targetWidth, targetHeight);
    context.draw(false, () => {
      wx.canvasToTempFilePath({
        canvasId: 'resizeCanvas',
        width: targetWidth,
        height: targetHeight,
        destWidth: targetWidth,
        destHeight: targetHeight,
        fileType: 'jpg',
        quality: this.data.quality / 100,
        success: (response) => this.finishImageResult(response.tempFilePath),
        fail: () => {
          this.setData({ isProcessing: false, error: '改尺寸失败，请降低图片大小后重试。' });
          trackEvent('process_fail', { toolSlug: TOOL_SLUGS.imageTools, reason: 'resize_failed' });
        }
      }, this);
    });
  },

  compressOnly() {
    wx.compressImage({
      src: this.data.sourcePath,
      quality: this.data.quality,
      success: (response) => this.finishImageResult(response.tempFilePath),
      fail: () => {
        this.setData({
          isProcessing: false,
          error: '图片处理失败，请换一张图片重试。'
        });
        trackEvent('process_fail', { toolSlug: TOOL_SLUGS.imageTools, reason: 'compress_failed' });
      }
    });
  },

  finishImageResult(resultPath) {
    wx.getFileInfo({
      filePath: resultPath,
      success: (info) => {
        const rate = savedRate(this.data.sourceSize, info.size);
        remember('图片工具', `压缩 ${this.data.quality}%`, { status: 'completed', toolSlug: TOOL_SLUGS.imageTools });
        trackEvent('process_success', {
          toolSlug: TOOL_SLUGS.imageTools,
          outputType: 'image',
          outputSize: info.size
        });
        openResult({
          kind: 'image',
          tool: '图片工具',
          toolSlug: TOOL_SLUGS.imageTools,
          name: '图片处理完成',
          resultPath,
          resultSize: formatBytes(info.size),
          savedRate: rate
        });
      },
      fail: () => {
        this.setData({ error: '结果文件读取失败，请重试。' });
        trackEvent('process_fail', { toolSlug: TOOL_SLUGS.imageTools, reason: 'result_read_failed' });
      },
      complete: () => {
        this.setData({ isProcessing: false });
      }
    });
  },

  onShareAppMessage() {
    return {
      title: '图片工具 · 压缩图片 / 改尺寸',
      path: '/pages/image-tools/image-tools'
    };
  }
});
