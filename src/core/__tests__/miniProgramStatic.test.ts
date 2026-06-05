import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

function readMini(path: string) {
  return readFileSync(resolve(root, path), 'utf8');
}

describe('mini program primary experience', () => {
  it('configures CloudBase and cloudfunctionRoot', () => {
    const app = readMini('miniprogram/app.js');
    const project = JSON.parse(readMini('miniprogram/project.config.json'));

    expect(app).toContain('wx.cloud.init');
    expect(project.cloudfunctionRoot).toBe('cloudfunctions/');
  });

  it('does not present H5 as the primary action for OCR, scan, or PDF tools', () => {
    for (const page of ['ocr', 'scan-pdf', 'pdf-tools']) {
      const js = readMini(`miniprogram/pages/${page}/${page}.js`);
      const wxml = readMini(`miniprogram/pages/${page}/${page}.wxml`);

      expect(js).toContain('callCloudFunction');
      expect(wxml).not.toContain('在 H5');
      expect(wxml).not.toContain('复制 H5 链接');
    }
  });

  it('keeps H5 bridge as a fallback-only page', () => {
    const homeTools = readMini('miniprogram/utils/tools.js');
    const bridge = readMini('miniprogram/pages/h5-bridge/h5-bridge.wxml');

    expect(homeTools).not.toContain("mode: 'h5-bridge'");
    expect(bridge).toContain('备用');
  });

  it('offers result feedback and export actions inside the mini program', () => {
    const resultJs = readMini('miniprogram/pages/result/result.js');
    const resultWxml = readMini('miniprogram/pages/result/result.wxml');

    expect(resultJs).toContain('feedbackSubmit');
    expect(resultWxml).toContain('复制文字');
    expect(resultWxml).toContain('预览 PDF');
    expect(resultWxml).toContain('反馈');
  });
});
