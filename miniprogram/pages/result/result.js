const { promptOpenSettings } = require('../../utils/bridge');
const { callCloudFunction, downloadCloudFile } = require('../../utils/cloud');
const { normalizeError } = require('../../utils/errors');
const { trackEvent } = require('../../utils/analytics');
const { getRelatedTools, getToolPath } = require('../../utils/tools');
const { getResult } = require('../../utils/results');

Page({
  data: {
    resultId: '',
    tool: '处理结果',
    name: '',
    kind: 'text',
    text: '',
    confidence: 0,
    confidenceLabel: '',
    durationMs: 0,
    fileID: '',
    pageCount: 0,
    resultSize: '',
    resultPath: '',
    savedRate: 0,
    toolSlug: '',
    relatedTools: [],
    feedbackContent: '',
    feedbackRating: 5,
    feedbackMessage: '',
    error: ''
  },

  onLoad(options) {
    const resultId = decodeURIComponent(options.resultId || '');
    const result = getResult(resultId);
    if (!result) {
      this.setData({ error: '结果已失效，请重新处理。' });
      return;
    }

    const confidence = Number(result.confidence || 0);
    this.setData({
      ...result,
      resultId,
      confidence,
      confidenceLabel: confidence ? `${Math.round(confidence * 100)}%` : '',
      relatedTools: getRelatedTools(result.toolSlug)
    });
    trackEvent('process_success', { toolSlug: result.toolSlug, location: 'result_page', outputType: result.kind });
  },

  copyText() {
    if (!this.data.text) return;
    wx.setClipboardData({
      data: this.data.text,
      success: () => {
        trackEvent('export_click', { toolSlug: this.data.toolSlug, action: 'copy_text', outputType: 'text' });
      }
    });
  },

  async previewPdf() {
    if (!this.data.fileID) return;
    try {
      const tempFilePath = await downloadCloudFile(this.data.fileID);
      wx.openDocument({
        filePath: tempFilePath,
        fileType: 'pdf',
        showMenu: true
      });
      trackEvent('export_click', { toolSlug: this.data.toolSlug, action: 'open_pdf', outputType: 'pdf' });
    } catch (error) {
      const normalized = normalizeError(error);
      this.setData({ error: normalized.message });
    }
  },

  async sharePdf() {
    if (!this.data.fileID || !wx.shareFileMessage) {
      this.setData({ error: '当前微信版本不支持直接分享文件，请先预览 PDF 后从菜单分享。' });
      return;
    }
    try {
      const tempFilePath = await downloadCloudFile(this.data.fileID);
      wx.shareFileMessage({
        filePath: tempFilePath,
        fileName: this.data.name || '处理结果.pdf'
      });
      trackEvent('export_click', { toolSlug: this.data.toolSlug, action: 'share_pdf', outputType: 'pdf' });
    } catch (error) {
      const normalized = normalizeError(error);
      this.setData({ error: normalized.message });
    }
  },

  saveImage() {
    if (!this.data.resultPath) return;
    wx.saveImageToPhotosAlbum({
      filePath: this.data.resultPath,
      success: () => {
        wx.showToast({ title: '已保存' });
        trackEvent('export_click', { toolSlug: this.data.toolSlug, action: 'save_album', outputType: 'image' });
      },
      fail: () => {
        promptOpenSettings('保存到相册需要授权，请在设置中开启相册权限。');
        trackEvent('process_fail', { toolSlug: this.data.toolSlug, reason: 'album_permission_denied' });
      }
    });
  },

  changeFeedback(event) {
    this.setData({ feedbackContent: event.detail.value });
  },

  changeRating(event) {
    this.setData({ feedbackRating: Number(event.currentTarget.dataset.rating) });
  },

  async feedbackSubmit() {
    const content = this.data.feedbackContent.trim();
    if (!content) {
      this.setData({ feedbackMessage: '请先写一句反馈，方便定位问题。' });
      return;
    }

    try {
      await callCloudFunction('feedbackSubmit', {
        toolSlug: this.data.toolSlug,
        rating: this.data.feedbackRating,
        category: this.data.kind,
        content,
        context: {
          resultId: this.data.resultId,
          outputType: this.data.kind
        }
      });
      this.setData({ feedbackMessage: '反馈已提交，感谢你帮我们把工具打磨得更好。', feedbackContent: '' });
      trackEvent('feedback_submit', { toolSlug: this.data.toolSlug, rating: this.data.feedbackRating });
    } catch (error) {
      const normalized = normalizeError(error);
      this.setData({ feedbackMessage: normalized.message });
    }
  },

  openRelated(event) {
    const slug = event.currentTarget.dataset.slug;
    trackEvent('related_tool_click', { toolSlug: this.data.toolSlug, relatedToolSlug: slug });
    wx.navigateTo({ url: getToolPath(slug) });
  },

  backHome() {
    wx.reLaunch({ url: '/pages/home/home' });
  },

  onShareAppMessage() {
    return {
      title: this.data.tool,
      path: '/pages/home/home'
    };
  }
});
