import { getToolBySlug } from './toolRegistry';
import type { AnalyticsEventName, DisclosureItem, ToolManifest } from './types';

export const analyticsEvents: AnalyticsEventName[] = [
  'home_view',
  'cta_click',
  'input_ready',
  'process_start',
  'process_success',
  'process_fail',
  'export_click',
  'reuse_click',
  'related_tool_click',
  'privacy_notice_view',
  'h5_bridge_click',
  'feedback_submit'
];

export const imageCompressManifest: ToolManifest = getToolBySlug('image-compress') as ToolManifest;

export const disclosures: DisclosureItem[] = [
  {
    name: 'Tesseract.js',
    repository: 'https://github.com/naptha/tesseract.js',
    license: 'Apache-2.0',
    copyright: 'Tesseract.js contributors',
    noticeUrl: 'https://github.com/naptha/tesseract.js/blob/master/LICENSE.md',
    modifiedSource: false
  },
  {
    name: 'pdf-lib',
    repository: 'https://github.com/Hopding/pdf-lib',
    license: 'MIT',
    copyright: 'pdf-lib contributors',
    noticeUrl: 'https://github.com/Hopding/pdf-lib/blob/master/LICENSE.md',
    modifiedSource: false
  },
  {
    name: 'Squoosh',
    repository: 'https://github.com/GoogleChromeLabs/squoosh',
    license: 'Apache-2.0',
    copyright: 'GoogleChromeLabs contributors',
    noticeUrl: 'https://github.com/GoogleChromeLabs/squoosh/blob/dev/LICENSE',
    modifiedSource: false
  },
  {
    name: 'React',
    repository: 'https://github.com/facebook/react',
    license: 'MIT',
    copyright: 'Meta Platforms, Inc. and affiliates',
    noticeUrl: 'https://github.com/facebook/react/blob/main/LICENSE',
    modifiedSource: false
  },
  {
    name: 'Vite',
    repository: 'https://github.com/vitejs/vite',
    license: 'MIT',
    copyright: 'Vite contributors',
    noticeUrl: 'https://github.com/vitejs/vite/blob/main/LICENSE',
    modifiedSource: false
  }
];
