export type SupportedMimeType = 'image/jpeg' | 'image/png' | 'image/webp';

export type SupportedPdfMimeType = 'application/pdf';

export type SupportedTextMimeType = 'text/plain';

export type SupportedOutputMimeType = SupportedMimeType | SupportedPdfMimeType | SupportedTextMimeType;

export type PrivacyLevel = 'local-only' | 'temporary-upload' | 'cloud-history';

export type ToolCategory = 'ocr' | 'scan' | 'pdf' | 'image' | 'utility' | 'knowledge';

export type LaunchPhase = 'launch' | 'next' | 'later' | 'legacy';

export type ProcessingMode = 'local' | 'hybrid' | 'server';

export type ToolInputType = 'image' | 'pdf' | 'text';

export type ToolOutputType = 'image' | 'pdf' | 'text' | 'qr';

export type AnalyticsEventName =
  | 'home_view'
  | 'cta_click'
  | 'input_ready'
  | 'process_start'
  | 'process_success'
  | 'process_fail'
  | 'export_click'
  | 'reuse_click'
  | 'related_tool_click'
  | 'privacy_notice_view'
  | 'h5_bridge_click'
  | 'feedback_submit';

export type AnalyticsChannel = 'direct' | 'wechat' | 'mini-program' | 'content' | 'unknown';

export interface AnalyticsEventProperties {
  toolSlug?: string;
  category?: ToolCategory | string;
  inputType?: string;
  outputType?: string;
  channel?: AnalyticsChannel;
  sourceContentId?: string;
  fileSizeBucket?: string;
  durationBucket?: string;
  errorCode?: string;
  isMiniProgram?: boolean;
  location?: string;
  reason?: string;
  action?: string;
  fileCount?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface ToolParameterSchema {
  quality: {
    min: number;
    max: number;
    step: number;
    defaultValue: number;
  };
  maxWidth: {
    min: number;
    max: number;
    step: number;
    defaultValue: number;
  };
  outputType: {
    defaultValue: SupportedMimeType;
    options: SupportedMimeType[];
  };
}

export interface RelatedTool {
  slug: string;
  name: string;
  status: 'planned' | 'researching' | 'available';
  reason: string;
}

export interface ToolManifest {
  slug: string;
  name: string;
  tagline: string;
  category?: ToolCategory;
  demandScore?: number;
  complexityScore?: number;
  launchPhase?: LaunchPhase;
  processingMode?: ProcessingMode;
  inputTypes?: ToolInputType[];
  outputTypes?: ToolOutputType[];
  scenarioWords: string[];
  supportedMimeTypes: SupportedMimeType[];
  privacyLevel: PrivacyLevel;
  localOnly: boolean;
  maxFileSizeBytes: number;
  parameters: ToolParameterSchema;
  analyticsEvents: AnalyticsEventName[];
  relatedTools: RelatedTool[];
}

export interface CompressionOptions {
  quality: number;
  maxWidth: number;
  outputType: SupportedMimeType;
}

export interface ProcessingInput {
  file: File;
  options: CompressionOptions;
}

export interface BaseProcessingResult {
  id: string;
  kind: ToolOutputType;
  toolSlug: string;
  sourceFileName: string;
  createdAt: string;
}

export interface ImageResult extends BaseProcessingResult {
  kind: 'image';
  originalFileName: string;
  originalSize: number;
  outputSize: number;
  outputBlob: Blob;
  outputFileName: string;
  outputMimeType: SupportedMimeType;
  previewUrl: string;
  compressionRate: number;
  width: number;
  height: number;
  options: CompressionOptions;
}

export interface TextResult extends BaseProcessingResult {
  kind: 'text';
  text: string;
  copyableText: string;
  confidence: number;
  durationMs: number;
  outputFileName: string;
  outputMimeType: SupportedTextMimeType;
}

export interface PdfResult extends BaseProcessingResult {
  kind: 'pdf';
  outputBlob: Blob;
  outputFileName: string;
  outputMimeType: SupportedPdfMimeType;
  outputSize: number;
  pageCount: number;
  previewUrl?: string;
}

export interface QrResult extends BaseProcessingResult {
  kind: 'qr';
  outputBlob: Blob;
  outputFileName: string;
  outputMimeType: SupportedMimeType;
  previewUrl: string;
  encodedText: string;
}

export type ProcessingResult = ImageResult | TextResult | PdfResult | QrResult;

export interface LocalProcessor {
  process(
    input: ProcessingInput,
    onProgress?: (progress: number, label: string) => void
  ): Promise<ImageResult>;
}

export interface DisclosureItem {
  name: string;
  repository: string;
  license: string;
  copyright: string;
  noticeUrl?: string;
  modifiedSource: boolean;
}

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  createdAt: string;
  properties?: AnalyticsEventProperties;
}

export interface RecentTask {
  id: string;
  fileName: string;
  toolSlug?: string;
  toolName?: string;
  createdAt: string;
  originalSize: number;
  outputSize: number;
  quality: number;
  maxWidth: number;
  mimeType: SupportedMimeType;
}
