const PRODUCT_NAME = '手机办公文件处理助手';
const CLOUD_ENV_ID = '';

// 部署后替换为真实 H5 域名，并在微信公众平台配置业务域名。
const H5_BASE_URL = 'http://localhost:5173';

const TOOL_SLUGS = {
  photoOcr: 'photo-ocr',
  scanToPdf: 'scan-to-pdf',
  pdfTools: 'pdf-tools',
  imageTools: 'image-tools'
};

function buildH5ToolUrl(toolSlug, extraQuery = {}) {
  const params = new URLSearchParams({
    tool: toolSlug,
    from: 'mini-program',
    channel: 'mini-program',
    ...extraQuery
  });
  return `${H5_BASE_URL.replace(/\/$/, '')}/?${params.toString()}`;
}

module.exports = {
  PRODUCT_NAME,
  CLOUD_ENV_ID,
  H5_BASE_URL,
  TOOL_SLUGS,
  buildH5ToolUrl
};
