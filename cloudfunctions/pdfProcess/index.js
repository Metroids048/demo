const { PDFDocument } = require('pdf-lib');

function createMain(options = {}) {
  const cloud = options.cloud || createCloud();
  const now = options.now || (() => Date.now());

  return async function main(event = {}) {
    const mode = event.mode;
    const fileIDs = Array.isArray(event.fileIDs) ? event.fileIDs : [];
    if (!fileIDs.length) {
      return fail('NO_FILES', '请先选择文件。');
    }
    if (mode !== 'imagesToPdf' && mode !== 'mergePdf') {
      return fail('INVALID_INPUT', 'PDF 处理模式不支持。');
    }
    if (mode === 'mergePdf' && fileIDs.length < 2) {
      return fail('INVALID_INPUT', 'PDF 合并至少需要 2 个文件。');
    }

    try {
      const pdf = await PDFDocument.create();
      if (mode === 'imagesToPdf') {
        for (const fileID of fileIDs) {
          const downloaded = await cloud.downloadFile({ fileID });
          const bytes = toUint8Array(downloaded.fileContent);
          const image = await embedImage(pdf, bytes, fileID);
          const page = pdf.addPage([image.width, image.height]);
          page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
        }
      } else {
        for (const fileID of fileIDs) {
          const downloaded = await cloud.downloadFile({ fileID });
          const source = await PDFDocument.load(downloaded.fileContent);
          const pages = await pdf.copyPages(source, source.getPageIndices());
          pages.forEach((page) => pdf.addPage(page));
        }
      }

      const bytes = await pdf.save();
      const outputName = sanitizeOutputName(event.outputName || `${mode}-${now()}.pdf`);
      const cloudPath = `pdf-output/${now()}-${outputName}`;
      const uploaded = await cloud.uploadFile({
        cloudPath,
        fileContent: Buffer.from(bytes)
      });

      return {
        ok: true,
        fileID: uploaded.fileID,
        outputName,
        pageCount: pdf.getPageCount(),
        fileSize: bytes.length,
        fileSizeLabel: formatBytes(bytes.length),
        expiresAt: new Date(now() + 24 * 60 * 60 * 1000).toISOString()
      };
    } catch (error) {
      return fail('PDF_FAILED', `PDF 处理失败：${error.message || 'unknown'}`);
    }
  };
}

function createCloud() {
  const cloud = require('wx-server-sdk');
  cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
  return cloud;
}

function toUint8Array(content) {
  if (content instanceof Uint8Array) return content;
  return new Uint8Array(content);
}

async function embedImage(pdf, bytes, fileID) {
  const lower = String(fileID).toLowerCase();
  if (lower.endsWith('.png')) {
    return pdf.embedPng(bytes);
  }
  return pdf.embedJpg(bytes);
}

function sanitizeOutputName(name) {
  const safe = String(name).replace(/[^\w.-]/g, '_');
  return safe.endsWith('.pdf') ? safe : `${safe}.pdf`;
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${Number.isInteger(value) ? value : value.toFixed(1)} ${units[exponent]}`;
}

function fail(errorCode, message) {
  return { ok: false, errorCode, message };
}

async function main(event, context) {
  return createMain()(event, context);
}

module.exports = {
  createMain,
  main
};
