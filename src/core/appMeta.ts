export const PRODUCT_NAME = '手机办公文件处理助手';

export const PRODUCT_TAGLINE =
  '在微信里快速处理图片、文字、PDF 和扫描件，不下载 App，不登录也能完成常用办公任务。';

export const SEO_TITLE = `${PRODUCT_NAME} · 拍图识字 / 扫描 PDF / PDF 合并 / 图片压缩`;

export const SEO_DESCRIPTION =
  '浏览器本地优先的手机办公文件处理助手。支持拍图识字、多图转 PDF、PDF 合并、图片压缩与格式转换，默认不上传文件。';

export interface CapabilityBoundary {
  slug: string;
  h5Status: 'available' | 'planned';
  miniProgramStatus: 'available' | 'h5-bridge' | 'planned';
  summary: string;
}

export const capabilityBoundaries: CapabilityBoundary[] = [
  {
    slug: 'photo-ocr',
    h5Status: 'available',
    miniProgramStatus: 'h5-bridge',
    summary: 'H5 本地 OCR；小程序端拍照后跳转 H5 完成识别。'
  },
  {
    slug: 'scan-to-pdf',
    h5Status: 'available',
    miniProgramStatus: 'h5-bridge',
    summary: 'H5 支持多图转 PDF；小程序端选图后跳转 H5 生成。'
  },
  {
    slug: 'pdf-tools',
    h5Status: 'available',
    miniProgramStatus: 'h5-bridge',
    summary: 'H5 支持 PDF 合并与图片转 PDF；暂不支持拆分/提取页面。'
  },
  {
    slug: 'image-tools',
    h5Status: 'available',
    miniProgramStatus: 'available',
    summary: 'H5 支持压缩、改尺寸、格式转换；小程序端支持微信原生压缩与保存相册。'
  }
];

export const deferredCapabilities = [
  'PDF 拆分与提取页面',
  '扫描件边缘检测与透视矫正',
  '云 OCR 与云历史',
  '去背景、证件照、流程图/脑图工具'
];

export function getCapabilityBoundary(slug: string): CapabilityBoundary | undefined {
  return capabilityBoundaries.find((item) => item.slug === slug);
}

export function isH5Available(slug: string): boolean {
  return getCapabilityBoundary(slug)?.h5Status === 'available';
}

export function isMiniProgramNative(slug: string): boolean {
  return getCapabilityBoundary(slug)?.miniProgramStatus === 'available';
}
