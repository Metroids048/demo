const { TOOL_SLUGS } = require('../../utils/config');
const { uploadLocalFile, callCloudFunction } = require('../../utils/cloud');
const { normalizeError } = require('../../utils/errors');
const { trackEvent } = require('../../utils/analytics');
const { formatBytes, remember } = require('../../utils/recent');
const { openResult } = require('../../utils/results');

Page({
  data: {
    files: [],
    isProcessing: false,
    error: ''
  },

  chooseImages() {
    wx.chooseMedia({
      count: 9,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (response) => {
        const files = response.tempFiles.map((file, index) => ({
          id: `${Date.now()}-${index}`,
          path: file.tempFilePath,
          size: file.size,
          sizeLabel: formatBytes(file.size)
        }));
        this.setData({ files, error: '' });
        trackEvent('input_ready', { toolSlug: TOOL_SLUGS.scanToPdf, inputType: 'image', fileCount: files.length });
      }
    });
  },

  removeFile(event) {
    const id = event.currentTarget.dataset.id;
    this.setData({ files: this.data.files.filter((file) => file.id !== id) });
  },

  moveUp(event) {
    const index = Number(event.currentTarget.dataset.index);
    if (index <= 0) return;
    const files = [...this.data.files];
    [files[index - 1], files[index]] = [files[index], files[index - 1]];
    this.setData({ files });
  },

  async createPdf() {
    if (!this.data.files.length) {
      this.setData({ error: '请先选择图片。' });
      return;
    }

    this.setData({ isProcessing: true, error: '' });
    trackEvent('process_start', {
      toolSlug: TOOL_SLUGS.scanToPdf,
      inputType: 'image',
      outputType: 'pdf',
      fileCount: this.data.files.length
    });

    try {
      const fileIDs = [];
      for (const file of this.data.files) {
        fileIDs.push(await uploadLocalFile(file.path, 'scan-pdf-input'));
      }

      const result = await callCloudFunction('pdfProcess', {
        mode: 'imagesToPdf',
        fileIDs,
        outputName: `scan-${Date.now()}.pdf`
      });

      remember('扫描成 PDF', `${this.data.files.length} 张图片`, { status: 'completed', toolSlug: TOOL_SLUGS.scanToPdf });
      trackEvent('process_success', { toolSlug: TOOL_SLUGS.scanToPdf, outputType: 'pdf', pageCount: result.pageCount });
      openResult({
        kind: 'pdf',
        tool: '扫描成 PDF',
        toolSlug: TOOL_SLUGS.scanToPdf,
        name: result.outputName || '扫描件.pdf',
        fileID: result.fileID,
        pageCount: result.pageCount || this.data.files.length,
        resultSize: result.fileSizeLabel || '',
        expiresAt: result.expiresAt || ''
      });
    } catch (error) {
      const normalized = normalizeError(error);
      this.setData({ error: normalized.message });
      trackEvent('process_fail', { toolSlug: TOOL_SLUGS.scanToPdf, reason: normalized.errorCode });
    } finally {
      this.setData({ isProcessing: false });
    }
  },

  onShareAppMessage() {
    return {
      title: '扫描成 PDF · 多图整理成一份文件',
      path: '/pages/scan-pdf/scan-pdf'
    };
  }
});
