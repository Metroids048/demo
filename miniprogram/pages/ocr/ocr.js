const { TOOL_SLUGS } = require('../../utils/config');
const { uploadLocalFile, callCloudFunction } = require('../../utils/cloud');
const { normalizeError } = require('../../utils/errors');
const { trackEvent } = require('../../utils/analytics');
const { formatBytes, remember } = require('../../utils/recent');
const { openResult } = require('../../utils/results');

Page({
  data: {
    imagePath: '',
    sizeLabel: '',
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
          trackEvent('process_fail', { toolSlug: TOOL_SLUGS.photoOcr, reason: 'file_too_large' });
          return;
        }
        this.setData({
          imagePath: file.tempFilePath,
          sizeLabel: formatBytes(file.size),
          error: ''
        });
        trackEvent('input_ready', { toolSlug: TOOL_SLUGS.photoOcr, inputType: 'image', fileSize: file.size });
      },
      fail: () => {
        this.setData({ error: '未选择图片，请重试。' });
      }
    });
  },

  async recognizeImage() {
    if (!this.data.imagePath) {
      this.setData({ error: '请先选择图片。' });
      return;
    }

    this.setData({ isProcessing: true, error: '' });
    trackEvent('process_start', { toolSlug: TOOL_SLUGS.photoOcr, inputType: 'image', outputType: 'text' });

    try {
      const fileID = await uploadLocalFile(this.data.imagePath, 'ocr-input');
      const result = await callCloudFunction('ocrRecognize', {
        fileID,
        language: 'zh_en'
      });

      remember('拍图识字', 'OCR 识别完成', { status: 'completed', toolSlug: TOOL_SLUGS.photoOcr });
      trackEvent('process_success', { toolSlug: TOOL_SLUGS.photoOcr, outputType: 'text' });
      openResult({
        kind: 'text',
        tool: '拍图识字',
        toolSlug: TOOL_SLUGS.photoOcr,
        name: 'OCR 识别结果',
        text: result.text || '',
        confidence: result.confidence || 0,
        durationMs: result.durationMs || 0,
        provider: result.provider || 'cloud-ocr'
      });
    } catch (error) {
      const normalized = normalizeError(error);
      this.setData({ error: normalized.message });
      trackEvent('process_fail', { toolSlug: TOOL_SLUGS.photoOcr, reason: normalized.errorCode });
    } finally {
      this.setData({ isProcessing: false });
    }
  },

  onShareAppMessage() {
    return {
      title: '拍图识字 · 图片转文字 OCR',
      path: '/pages/ocr/ocr'
    };
  }
});
