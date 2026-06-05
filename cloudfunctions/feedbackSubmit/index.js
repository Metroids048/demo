function createMain(options = {}) {
  const db = options.db || createDatabase();
  const now = options.now || (() => new Date().toISOString());

  return async function main(event = {}) {
    const validation = validate(event);
    if (!validation.ok) {
      return validation;
    }

    const data = {
      toolSlug: event.toolSlug,
      rating: Number(event.rating),
      category: event.category,
      content: String(event.content).trim(),
      contact: event.contact || '',
      context: event.context || {},
      createdAt: now()
    };

    try {
      if (!db) {
        return fail('FEEDBACK_STORE_NOT_CONFIGURED', '反馈服务未配置，请稍后重试。');
      }
      const response = await db.collection('feedback').add({ data });
      return { ok: true, id: response._id || response.id || '' };
    } catch (error) {
      return fail('FEEDBACK_FAILED', `反馈提交失败：${error.message || 'unknown'}`);
    }
  };
}

function createDatabase() {
  try {
    const cloud = require('wx-server-sdk');
    cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
    return cloud.database();
  } catch (error) {
    return null;
  }
}

function validate(event) {
  if (!event.toolSlug || !event.content) {
    return fail('INVALID_INPUT', '请填写反馈内容。');
  }
  const rating = Number(event.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return fail('INVALID_INPUT', '评分需在 1 到 5 之间。');
  }
  return { ok: true };
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
