function createMain(options = {}) {
  const env = options.env || process.env;
  const cloud = options.cloud || createCloud();
  const ocrProvider = options.ocrProvider || createTencentOcrProvider(env);
  const now = options.now || (() => Date.now());

  return async function main(event = {}) {
    const startedAt = now();
    const fileID = event.fileID;
    if (!fileID) {
      return fail('NO_FILES', '请先上传需要识别的图片。');
    }

    if (!env.TENCENTCLOUD_SECRET_ID || !env.TENCENTCLOUD_SECRET_KEY || !ocrProvider) {
      return fail('OCR_NOT_CONFIGURED', 'OCR 服务未配置，暂时不能识别文字。');
    }

    try {
      const downloaded = await cloud.downloadFile({ fileID });
      const recognized = await ocrProvider.recognize({
        imageBuffer: downloaded.fileContent,
        language: event.language || 'zh_en'
      });

      return {
        ok: true,
        text: recognized.text || '',
        confidence: Number(recognized.confidence || 0),
        blocks: recognized.blocks || [],
        durationMs: Math.max(0, now() - startedAt),
        provider: 'tencentcloud-ocr'
      };
    } catch (error) {
      return fail('OCR_FAILED', `OCR 识别失败：${error.message || 'unknown'}`);
    }
  };
}

function createCloud() {
  const cloud = require('wx-server-sdk');
  cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
  return cloud;
}

function createTencentOcrProvider(env) {
  try {
    const tencentcloud = require('tencentcloud-sdk-nodejs');
    const OcrClient = tencentcloud.ocr.v20181119.Client;
    const client = new OcrClient({
      credential: {
        secretId: env.TENCENTCLOUD_SECRET_ID,
        secretKey: env.TENCENTCLOUD_SECRET_KEY
      },
      region: env.TENCENTCLOUD_OCR_REGION || 'ap-guangzhou',
      profile: {
        httpProfile: {
          endpoint: 'ocr.tencentcloudapi.com'
        }
      }
    });

    return {
      async recognize(input) {
        const response = await client.GeneralBasicOCR({
          ImageBase64: Buffer.from(input.imageBuffer).toString('base64'),
          LanguageType: input.language === 'zh_en' ? 'zh_rare' : 'auto'
        });
        const blocks = (response.TextDetections || []).map((item) => ({
          text: item.DetectedText || '',
          confidence: Number(item.Confidence || 0) / 100
        }));
        const text = blocks.map((block) => block.text).filter(Boolean).join('\n');
        const confidence = blocks.length
          ? blocks.reduce((total, block) => total + block.confidence, 0) / blocks.length
          : 0;
        return { text, confidence, blocks };
      }
    };
  } catch (error) {
    return null;
  }
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
