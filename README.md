# 手机办公文件处理助手：小程序优先版

这是一个小程序优先的轻办公文件处理 MVP。当前定位不是“图片压缩工具”，而是在微信里完成拍图识字、扫描成 PDF、PDF 合并/图片转 PDF、图片轻处理等高频任务。

## 首版能力

| 工具 | 小程序端 | H5 |
|---|---|---|
| 拍图识字 | 选图/拍照、上传云函数、云 OCR、端内复制和反馈 | 备用 OCR/SEO 承接 |
| 扫描成 PDF | 多图选择、排序、云函数生成 PDF、预览和分享 | 备用生成 PDF |
| PDF 工具 | 选择 PDF 合并，或选择图片转 PDF | 备用高级处理 |
| 图片工具 | 原生压缩、最长边限制、保存相册 | 高级格式转换备用 |

首版不做 PDF 拆分/提取页、去背景、证件照、账号、会员、云历史、Mermaid/Markmap/Excalidraw。

## 目录

- `miniprogram/`：小程序主体验，含工具页、统一结果页、云调用、错误处理、最近记录和埋点。
- `cloudfunctions/`：CloudBase 云函数，包含 `ocrRecognize`、`pdfProcess`、`feedbackSubmit`。
- `src/`：H5 备用版和 shared core，保留 SEO/内容承接与本地处理能力。
- `docs/`：PRD、交互设计、上架资料、增长留存、验收矩阵和发布管理。

## 本地运行

```bash
npm install
npm run dev
```

H5 默认地址为 `http://localhost:5173`。小程序导入 `miniprogram/`，并在微信开发者工具里配置真实 `appid`、云环境和云函数。

## 云函数配置

1. 在 `miniprogram/utils/config.js` 设置 `CLOUD_ENV_ID`。
2. 在微信开发者工具上传 `cloudfunctions/ocrRecognize`、`cloudfunctions/pdfProcess`、`cloudfunctions/feedbackSubmit`。
3. OCR 需要在云函数环境变量配置 `TENCENTCLOUD_SECRET_ID`、`TENCENTCLOUD_SECRET_KEY`，可选 `TENCENTCLOUD_OCR_REGION`。
4. 未配置 OCR 凭证时，`ocrRecognize` 会返回 `OCR_NOT_CONFIGURED`，小程序会显示“服务未配置”，不会展示模拟结果。

## 验证

```bash
npm run verify
npm audit --audit-level=critical
```

`npm run verify` 覆盖类型检查、单元测试、云函数契约测试、小程序静态检查和 H5 构建。

## 关键文档

- [PRD](docs/prd.md)
- [小程序上架资料](docs/mini-program-submission.md)
- [交互设计说明](docs/interaction-design.md)
- [增长与留存](docs/growth-assets.md)
- [项目发布管理](docs/project-management.md)
- [上线前验收矩阵](docs/verification-matrix.md)
