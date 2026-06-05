const ERROR_MESSAGES = {
  CLOUD_NOT_AVAILABLE: '当前微信版本不支持云能力，请升级微信后重试。',
  UPLOAD_FAILED: '文件上传失败，请检查网络后重试。',
  CLOUD_CALL_FAILED: '服务调用失败，请稍后重试。',
  OCR_NOT_CONFIGURED: 'OCR 服务未配置，暂时不能识别文字。',
  OCR_FAILED: 'OCR 识别失败，请换一张更清晰的图片重试。',
  PDF_FAILED: 'PDF 处理失败，请换一组文件重试。',
  NO_FILES: '请先选择文件。',
  INVALID_INPUT: '文件格式或参数不支持。'
};

function normalizeError(error) {
  const errorCode = error?.errorCode || error?.errCode || 'CLOUD_CALL_FAILED';
  const message = error?.message || ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.CLOUD_CALL_FAILED;
  return { errorCode, message };
}

module.exports = {
  ERROR_MESSAGES,
  normalizeError
};
