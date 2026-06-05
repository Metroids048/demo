import { MAX_LOCAL_FILE_SIZE_BYTES, SUPPORTED_IMAGE_TYPES } from './metrics';
import type { AnalyticsEventName, SupportedMimeType, ToolCategory, ToolManifest, ToolParameterSchema } from './types';

export const toolRegistry: ToolManifest[] = [
  {
    slug: 'photo-ocr',
    name: '拍图识字',
    tagline: '拍讲义、票据、截图，快速提取可复制文字。',
    category: 'ocr',
    demandScore: 10,
    complexityScore: 7,
    launchPhase: 'launch',
    processingMode: 'hybrid',
    inputTypes: ['image'],
    outputTypes: ['text'],
    scenarioWords: ['图片转文字', 'OCR', '拍照识字', '提取文字'],
    supportedMimeTypes: SUPPORTED_IMAGE_TYPES,
    privacyLevel: 'local-only',
    localOnly: true,
    maxFileSizeBytes: MAX_LOCAL_FILE_SIZE_BYTES,
    parameters: defaultImageParameters(),
    analyticsEvents: defaultEvents(),
    relatedTools: [
      {
        slug: 'scan-to-pdf',
        name: '扫描成 PDF',
        status: 'available',
        reason: '识别文字后常需要整理成扫描文件。'
      }
    ]
  },
  {
    slug: 'scan-to-pdf',
    name: '扫描成 PDF',
    tagline: '图片灰度增强后生成 PDF，适合讲义、合同和报名材料。',
    category: 'scan',
    demandScore: 9,
    complexityScore: 5,
    launchPhase: 'launch',
    processingMode: 'local',
    inputTypes: ['image'],
    outputTypes: ['pdf', 'image'],
    scenarioWords: ['图片转 PDF', '扫描件', '拍照扫描', '文件整理'],
    supportedMimeTypes: SUPPORTED_IMAGE_TYPES,
    privacyLevel: 'local-only',
    localOnly: true,
    maxFileSizeBytes: MAX_LOCAL_FILE_SIZE_BYTES,
    parameters: defaultImageParameters(),
    analyticsEvents: defaultEvents(),
    relatedTools: [
      {
        slug: 'photo-ocr',
        name: '拍图识字',
        status: 'available',
        reason: '扫描材料经常还需要提取文字。'
      }
    ]
  },
  {
    slug: 'pdf-tools',
    name: 'PDF 工具',
    tagline: 'PDF 合并与图片转 PDF；拆分/提取页面放到二阶段。',
    category: 'pdf',
    demandScore: 9,
    complexityScore: 6,
    launchPhase: 'launch',
    processingMode: 'local',
    inputTypes: ['image', 'pdf'],
    outputTypes: ['pdf'],
    scenarioWords: ['PDF 合并', 'PDF 拆分', '图片转 PDF', '提取页面'],
    supportedMimeTypes: SUPPORTED_IMAGE_TYPES,
    privacyLevel: 'local-only',
    localOnly: true,
    maxFileSizeBytes: 20 * 1024 * 1024,
    parameters: defaultImageParameters(),
    analyticsEvents: defaultEvents(),
    relatedTools: [
      {
        slug: 'image-tools',
        name: '图片工具',
        status: 'available',
        reason: '转 PDF 前常需要裁剪、压缩或改尺寸。'
      }
    ]
  },
  {
    slug: 'image-tools',
    name: '图片工具',
    tagline: '压缩、裁剪、改尺寸、格式转换，作为办公文件处理的辅助能力。',
    category: 'image',
    demandScore: 8,
    complexityScore: 4,
    launchPhase: 'launch',
    processingMode: 'local',
    inputTypes: ['image'],
    outputTypes: ['image'],
    scenarioWords: ['图片压缩', '裁剪图片', '改尺寸', '格式转换'],
    supportedMimeTypes: SUPPORTED_IMAGE_TYPES,
    privacyLevel: 'local-only',
    localOnly: true,
    maxFileSizeBytes: MAX_LOCAL_FILE_SIZE_BYTES,
    parameters: defaultImageParameters(),
    analyticsEvents: defaultEvents(),
    relatedTools: [
      {
        slug: 'scan-to-pdf',
        name: '扫描成 PDF',
        status: 'available',
        reason: '处理好的图片常被整理成 PDF。'
      }
    ]
  },
  {
    slug: 'image-compress',
    name: '图片压缩',
    tagline: '现有压缩能力，保留为图片工具中的一个子功能。',
    category: 'image',
    demandScore: 5,
    complexityScore: 3,
    launchPhase: 'legacy',
    processingMode: 'local',
    inputTypes: ['image'],
    outputTypes: ['image'],
    scenarioWords: ['压图', '压缩图片', '缩小附件'],
    supportedMimeTypes: SUPPORTED_IMAGE_TYPES,
    privacyLevel: 'local-only',
    localOnly: true,
    maxFileSizeBytes: MAX_LOCAL_FILE_SIZE_BYTES,
    parameters: defaultImageParameters(),
    analyticsEvents: defaultEvents(),
    relatedTools: []
  },
  {
    slug: 'qr-tools',
    name: '二维码工具',
    tagline: '文本和链接生成二维码，补充低门槛流量入口。',
    category: 'utility',
    demandScore: 6,
    complexityScore: 3,
    launchPhase: 'next',
    processingMode: 'local',
    inputTypes: ['text'],
    outputTypes: ['qr', 'image'],
    scenarioWords: ['二维码生成', '链接转二维码', '保存二维码'],
    supportedMimeTypes: SUPPORTED_IMAGE_TYPES,
    privacyLevel: 'local-only',
    localOnly: true,
    maxFileSizeBytes: MAX_LOCAL_FILE_SIZE_BYTES,
    parameters: defaultImageParameters(),
    analyticsEvents: defaultEvents(),
    relatedTools: []
  }
];

export function getLaunchTools(): ToolManifest[] {
  return toolRegistry
    .filter((tool) => tool.launchPhase === 'launch')
    .sort((left, right) => (right.demandScore ?? 0) - (left.demandScore ?? 0));
}

export function getToolBySlug(slug: string): ToolManifest | undefined {
  return toolRegistry.find((tool) => tool.slug === slug);
}

export function getToolsByCategory(category: ToolCategory): ToolManifest[] {
  return toolRegistry.filter((tool) => tool.category === category);
}

function defaultEvents(): AnalyticsEventName[] {
  return [
    'home_view',
    'cta_click',
    'input_ready',
    'process_start',
    'process_success',
    'process_fail',
    'export_click',
    'reuse_click',
    'related_tool_click'
  ];
}

function defaultImageParameters(): ToolParameterSchema {
  return {
    quality: {
      min: 0.3,
      max: 0.95,
      step: 0.05,
      defaultValue: 0.78
    },
    maxWidth: {
      min: 640,
      max: 2560,
      step: 160,
      defaultValue: 1600
    },
    outputType: {
      defaultValue: 'image/jpeg',
      options: ['image/jpeg', 'image/png', 'image/webp'] satisfies SupportedMimeType[]
    }
  };
}
