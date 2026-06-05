const { TOOL_SLUGS } = require('../../utils/config');
const { uploadLocalFile, callCloudFunction } = require('../../utils/cloud');
const { normalizeError } = require('../../utils/errors');
const { trackEvent } = require('../../utils/analytics');
const { formatBytes, remember } = require('../../utils/recent');
const { openResult } = require('../../utils/results');

Page({
  data: {
    files: [],
    mode: '',
    isProcessing: false,
    error: ''
  },

  choosePdf() {
    wx.chooseMessageFile({
      count: 5,
      type: 'file',
      extension: ['pdf'],
      success: (response) => {
        const files = response.tempFiles.map((file, index) => ({
          id: `${Date.now()}-${index}`,
          name: file.name,
          path: file.path,
          size: file.size,
          sizeLabel: formatBytes(file.size)
        }));
        this.setData({ files, mode: 'mergePdf', error: '' });
        trackEvent('input_ready', { toolSlug: TOOL_SLUGS.pdfTools, fileCount: files.length, inputType: 'pdf' });
      }
    });
  },

  chooseImages() {
    wx.chooseMedia({
      count: 9,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (response) => {
        const files = response.tempFiles.map((file, index) => ({
          id: `${Date.now()}-${index}`,
          name: `图片 ${index + 1}`,
          path: file.tempFilePath,
          size: file.size,
          sizeLabel: formatBytes(file.size)
        }));
        this.setData({ files, mode: 'imagesToPdf', error: '' });
        trackEvent('input_ready', { toolSlug: TOOL_SLUGS.pdfTools, fileCount: files.length, inputType: 'image' });
      }
    });
  },

  async processFiles() {
    if (!this.data.files.length || !this.data.mode) {
      this.setData({ error: '请先选择 PDF 或图片。' });
      return;
    }
    if (this.data.mode === 'mergePdf' && this.data.files.length < 2) {
      this.setData({ error: 'PDF 合并至少需要 2 个 PDF 文件。' });
      return;
    }

    this.setData({ isProcessing: true, error: '' });
    trackEvent('process_start', {
      toolSlug: TOOL_SLUGS.pdfTools,
      inputType: this.data.mode === 'mergePdf' ? 'pdf' : 'image',
      outputType: 'pdf',
      fileCount: this.data.files.length
    });

    try {
      const fileIDs = [];
      for (const file of this.data.files) {
        fileIDs.push(await uploadLocalFile(file.path, this.data.mode === 'mergePdf' ? 'pdf-merge-input' : 'image-pdf-input'));
      }

      const result = await callCloudFunction('pdfProcess', {
        mode: this.data.mode,
        fileIDs,
        outputName: this.data.mode === 'mergePdf' ? `merged-${Date.now()}.pdf` : `images-${Date.now()}.pdf`
      });

      remember('PDF 工具', `${this.data.files.length} 个文件`, { status: 'completed', toolSlug: TOOL_SLUGS.pdfTools });
      trackEvent('process_success', { toolSlug: TOOL_SLUGS.pdfTools, outputType: 'pdf', pageCount: result.pageCount });
      openResult({
        kind: 'pdf',
        tool: 'PDF 工具',
        toolSlug: TOOL_SLUGS.pdfTools,
        name: result.outputName || '处理结果.pdf',
        fileID: result.fileID,
        pageCount: result.pageCount || 0,
        resultSize: result.fileSizeLabel || '',
        expiresAt: result.expiresAt || ''
      });
    } catch (error) {
      const normalized = normalizeError(error);
      this.setData({ error: normalized.message });
      trackEvent('process_fail', { toolSlug: TOOL_SLUGS.pdfTools, reason: normalized.errorCode });
    } finally {
      this.setData({ isProcessing: false });
    }
  },

  onShareAppMessage() {
    return {
      title: 'PDF 工具 · 合并 PDF / 图片转 PDF',
      path: '/pages/pdf-tools/pdf-tools'
    };
  }
});
