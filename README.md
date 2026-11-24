# 手机办公文件处理助手

一个面向微信小程序的轻办公 MVP，帮助用户从手机里的照片和文件快速提取文字、生成 PDF 或缩小图片。仓库同时提供 H5 版本，方便直接在浏览器体验基本流程。

| 场景 | 微信小程序 | H5 |
| --- | --- | --- |
| 从照片取字 | 选图或拍照，经 CloudBase 调用腾讯云 OCR | 通过 Tesseract.js 在浏览器识别 |
| 把多张图片整理成 PDF | 选图、排序，经云函数生成 PDF | 在浏览器生成 PDF |
| 合并 PDF | 选文件并经云函数处理 | 在浏览器合并 |
| 图片压缩 | 原生压缩，支持最长边限制 | 浏览器内调整尺寸和压缩 |

## 在浏览器运行

使用 Node.js 22.12+（推荐 24 LTS）和 npm。从仓库根目录运行以下命令，打开 [http://localhost:5173](http://localhost:5173)。H5 不需要腾讯云凭据。浏览器 OCR 首次使用可能需要联网加载识别资源。

```sh
npm ci
npm run dev
```

## 配置微信小程序

1. 在微信开发者工具中导入 `miniprogram/`。仓库使用测试 AppID 占位。连接云开发时，请使用自己的 AppID 和 CloudBase 环境。
2. 在本地设置 `miniprogram/utils/config.js` 的 `CLOUD_ENV_ID`。不要提交真实环境配置。
3. 在开发者工具中将云函数目录指向仓库根目录下独立的 `cloudfunctions/`，部署 `ocrRecognize`、`pdfProcess` 和 `feedbackSubmit`。
4. 在 `ocrRecognize` 的云函数环境变量中配置 `TENCENTCLOUD_SECRET_ID`、`TENCENTCLOUD_SECRET_KEY`，可选配置 `TENCENTCLOUD_OCR_REGION`。凭据只用于云函数。未配置时，OCR 会返回 `OCR_NOT_CONFIGURED`。

## 代码与验证

- `miniprogram/` 包含工具页、处理结果页与小程序云调用。
- `cloudfunctions/` 包含 OCR、PDF 处理和反馈接口。
- `src/` 包含 H5 界面、处理逻辑和测试。
- [验收矩阵](docs/verification-matrix.md)列出本地检查和微信真机、CloudBase 部署需要完成的检查。

`npm run verify` 执行 TypeScript 检查、Vitest 和 H5 生产构建。
