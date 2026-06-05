export interface ToolGrowthAsset {
  slug: string;
  displayName: string;
  keywords: string[];
  shareTitle: string;
  shareDescription: string;
  cta: string;
}

export const toolGrowthAssets: ToolGrowthAsset[] = [
  {
    slug: 'photo-ocr',
    displayName: '拍图识字',
    keywords: ['图片转文字', 'OCR', '拍照识字', '提取文字', '截图转文字'],
    shareTitle: '拍图识字 · 图片转文字 OCR',
    shareDescription: '拍讲义、票据、截图，快速提取可复制文字。',
    cta: '微信搜：拍图识字 OCR'
  },
  {
    slug: 'scan-to-pdf',
    displayName: '扫描成 PDF',
    keywords: ['图片转 PDF', '扫描件', '拍照扫描', '多图转 PDF', '报名材料'],
    shareTitle: '扫描成 PDF · 多图整理成一份文件',
    shareDescription: '多张照片按顺序整理成 PDF，适合报名材料和合同照片。',
    cta: '微信搜：扫描成 PDF'
  },
  {
    slug: 'pdf-tools',
    displayName: 'PDF 工具',
    keywords: ['PDF 合并', '图片转 PDF', 'PDF 工具', '合并 PDF', '文件整理'],
    shareTitle: 'PDF 工具 · 合并 PDF / 图片转 PDF',
    shareDescription: '从微信聊天选 PDF 合并，或把图片快速转成 PDF。',
    cta: '微信搜：PDF 合并工具'
  },
  {
    slug: 'image-tools',
    displayName: '图片工具',
    keywords: ['图片压缩', '压图', '缩小附件', '改尺寸', '格式转换'],
    shareTitle: '图片工具 · 压缩图片 / 改尺寸',
    shareDescription: '发送前压缩图片、调整尺寸或转换格式，本地处理更安心。',
    cta: '微信搜：图片压缩助手'
  }
];

export const miniProgramSearchKeywords = [
  '拍图识字',
  '图片转文字',
  'OCR',
  '扫描成 PDF',
  '图片转 PDF',
  'PDF 合并',
  '图片压缩',
  '压图',
  '文件处理',
  '办公助手'
];

export interface SeedContentTemplate {
  id: string;
  channel: 'short-video' | 'xiaohongshu' | 'wechat' | 'community';
  toolSlug: string;
  title: string;
  hook: string;
  cta: string;
}

export const seedContentTemplates: SeedContentTemplate[] = [
  {
    id: 'ocr-pain-01',
    channel: 'short-video',
    toolSlug: 'photo-ocr',
    title: '微信截图太多字？30 秒提取文字',
    hook: '讲义截图、票据照片、聊天截图，不用手打，直接复制文字。',
    cta: '微信搜：拍图识字 OCR'
  },
  {
    id: 'ocr-tutorial-01',
    channel: 'xiaohongshu',
    toolSlug: 'photo-ocr',
    title: '免费 OCR 教程：三步图片转文字',
    hook: '选图 → 开始识别 → 复制/导出 TXT，默认本地处理。',
    cta: '收藏这条，下次直接搜工具名'
  },
  {
    id: 'scan-result-01',
    channel: 'short-video',
    toolSlug: 'scan-to-pdf',
    title: '报名材料 5 张照片，1 分钟变 PDF',
    hook: '多图按顺序整理，适合合同、讲义、报名截图。',
    cta: '微信搜：扫描成 PDF'
  },
  {
    id: 'scan-tutorial-01',
    channel: 'xiaohongshu',
    toolSlug: 'scan-to-pdf',
    title: '手机把照片整理成 PDF 的最短路径',
    hook: '不用装 App，H5 本地生成 PDF，隐私更友好。',
    cta: '文末放小程序名 + 关键词'
  },
  {
    id: 'pdf-pain-01',
    channel: 'short-video',
    toolSlug: 'pdf-tools',
    title: '微信收到 3 份 PDF，合并只要 1 分钟',
    hook: '从聊天选文件，合并后下载转发，适合行政和财务临时处理。',
    cta: '微信搜：PDF 合并工具'
  },
  {
    id: 'pdf-tutorial-01',
    channel: 'wechat',
    toolSlug: 'pdf-tools',
    title: '图片转 PDF + PDF 合并，一个入口搞定',
    hook: '首版支持合并与图片转 PDF；拆分/提取页面放到二阶段。',
    cta: '转给常用的人'
  },
  {
    id: 'image-pain-01',
    channel: 'short-video',
    toolSlug: 'image-tools',
    title: '3.8MB 报名照发微信就糊？压到 280KB',
    hook: '肉眼几乎看不出区别，适合附件、活动图、商品图。',
    cta: '微信搜：图片压缩助手'
  },
  {
    id: 'image-result-01',
    channel: 'xiaohongshu',
    toolSlug: 'image-tools',
    title: '免费压图前后对比：节省 92% 体积',
    hook: '本地处理，不上传服务器；小程序端也可直接压缩保存。',
    cta: '保存关键词，下次直接搜'
  },
  {
    id: 'office-bundle-01',
    channel: 'community',
    toolSlug: 'photo-ocr',
    title: '整理了 4 个微信里常用的文件小工具',
    hook: 'OCR、扫描 PDF、PDF 合并、图片压缩，按任务入口而不是工具箱堆功能。',
    cta: '收藏 + 转给常用的人'
  },
  {
    id: 'privacy-01',
    channel: 'wechat',
    toolSlug: 'scan-to-pdf',
    title: '为什么这个工具默认本地处理',
    hook: '票据、合同、证件可能含敏感信息；首版不做公开文件库和云历史。',
    cta: '查看隐私说明后再使用'
  }
];

export function getGrowthAsset(slug: string): ToolGrowthAsset | undefined {
  return toolGrowthAssets.find((item) => item.slug === slug);
}

export function getSeedContentByTool(slug: string): SeedContentTemplate[] {
  return seedContentTemplates.filter((item) => item.toolSlug === slug);
}
