const { TOOL_SLUGS } = require('./config');

const launchTools = [
  {
    slug: TOOL_SLUGS.photoOcr,
    category: 'OCR',
    name: '拍图识字',
    desc: '拍照或选图后在小程序内调用云 OCR，识别结果可复制和反馈。',
    path: '/pages/ocr/ocr',
    mode: 'cloud'
  },
  {
    slug: TOOL_SLUGS.scanToPdf,
    category: 'SCAN',
    name: '扫描成 PDF',
    desc: '多图上传到云函数生成 PDF，结果可预览和分享。',
    path: '/pages/scan-pdf/scan-pdf',
    mode: 'cloud'
  },
  {
    slug: TOOL_SLUGS.pdfTools,
    category: 'PDF',
    name: 'PDF 工具',
    desc: '选择 PDF 合并，或选择图片转 PDF，首版不做拆分。',
    path: '/pages/pdf-tools/pdf-tools',
    mode: 'cloud'
  },
  {
    slug: TOOL_SLUGS.imageTools,
    category: 'IMAGE',
    name: '图片工具',
    desc: '小程序端可直接压缩、改质量并保存到相册。',
    path: '/pages/image-tools/image-tools',
    mode: 'native'
  }
];

const relatedTools = {
  [TOOL_SLUGS.photoOcr]: [{ slug: TOOL_SLUGS.scanToPdf, name: '扫描成 PDF' }],
  [TOOL_SLUGS.scanToPdf]: [{ slug: TOOL_SLUGS.pdfTools, name: 'PDF 工具' }],
  [TOOL_SLUGS.pdfTools]: [{ slug: TOOL_SLUGS.imageTools, name: '图片工具' }],
  [TOOL_SLUGS.imageTools]: [{ slug: TOOL_SLUGS.scanToPdf, name: '扫描成 PDF' }]
};

function getToolBySlug(slug) {
  return launchTools.find((tool) => tool.slug === slug);
}

function getRelatedTools(slug) {
  return relatedTools[slug] || [];
}

function getToolPath(slug) {
  const tool = getToolBySlug(slug);
  return tool ? tool.path : '/pages/home/home';
}

module.exports = {
  launchTools,
  getToolBySlug,
  getRelatedTools,
  getToolPath
};
