import { useEffect, useMemo, useRef, useState } from 'react';
import { trackEvent } from '../core/analytics';
import { deferredCapabilities, getCapabilityBoundary, PRODUCT_NAME } from '../core/appMeta';
import { BrowserImageCompressor } from '../core/imageProcessor';
import { formatBytes, isSupportedImageType, validateImageFile } from '../core/metrics';
import { BrowserOcrProcessor } from '../core/ocrProcessor';
import { createPdfFromImageFiles, mergePdfFiles } from '../core/pdfProcessor';
import { createBrowserRecentTaskStore } from '../core/recentTasks';
import { disclosures } from '../core/toolManifest';
import { getLaunchTools, getToolBySlug } from '../core/toolRegistry';
import type {
  CompressionOptions,
  ImageResult,
  PdfResult,
  ProcessingResult,
  RecentTask,
  SupportedMimeType,
  TextResult,
  ToolManifest
} from '../core/types';

const defaultOptions: CompressionOptions = {
  quality: 0.78,
  maxWidth: 1600,
  outputType: 'image/jpeg'
};

export function App() {
  const launchTools = useMemo(() => getLaunchTools(), []);
  const [activeSlug, setActiveSlug] = useState(launchTools[0]?.slug ?? 'photo-ocr');
  const activeTool = getToolBySlug(activeSlug) ?? launchTools[0];
  const recentStore = useMemo(() => createBrowserRecentTaskStore(), []);
  const imageCompressor = useMemo(() => new BrowserImageCompressor(), []);
  const ocrProcessor = useMemo(() => new BrowserOcrProcessor(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [options, setOptions] = useState<CompressionOptions>(defaultOptions);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);
  const [progress, setProgress] = useState({ value: 0, label: '' });
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedTool = params.get('tool');
    if (requestedTool && getToolBySlug(requestedTool)) {
      setActiveSlug(requestedTool);
    }
  }, []);

  useEffect(() => {
    trackEvent('home_view', { toolSlug: activeSlug, category: activeTool?.category });
    setRecentTasks(recentStore.list());
  }, [activeSlug, activeTool?.category, recentStore]);

  useEffect(() => {
    trackEvent('privacy_notice_view', { location: 'compliance_section' });
  }, []);

  useEffect(() => {
    return () => {
      if (sourcePreview) {
        URL.revokeObjectURL(sourcePreview);
      }
      if (result?.kind === 'image' && result.previewUrl) {
        URL.revokeObjectURL(result.previewUrl);
      }
    };
  }, [result, sourcePreview]);

  function switchTool(tool: ToolManifest) {
    setActiveSlug(tool.slug);
    setFiles([]);
    setResult(null);
    setError(null);
    setProgress({ value: 0, label: '' });
    if (sourcePreview) {
      URL.revokeObjectURL(sourcePreview);
      setSourcePreview(null);
    }
    trackEvent('cta_click', {
      toolSlug: tool.slug,
      category: tool.category,
      location: 'tool_card'
    });
  }

  function handleFiles(nextFiles: File[]) {
    if (!nextFiles.length || !activeTool) {
      return;
    }

    const validation = validateFilesForTool(nextFiles, activeTool);
    if (!validation.valid) {
      setError(validation.reason ?? '文件不可用，请更换后重试。');
      trackEvent('process_fail', {
        toolSlug: activeTool.slug,
        reason: validation.reason
      });
      return;
    }

    if (sourcePreview) {
      URL.revokeObjectURL(sourcePreview);
    }

    setFiles(nextFiles);
    setResult(null);
    setError(null);
    const firstImage = nextFiles.find((file) => file.type.startsWith('image/'));
    setSourcePreview(firstImage ? URL.createObjectURL(firstImage) : null);
    trackEvent('input_ready', {
      toolSlug: activeTool.slug,
      category: activeTool.category,
      inputType: nextFiles[0].type,
      fileCount: nextFiles.length
    });
  }

  async function processFiles(nextOptions = options) {
    if (!activeTool || !files.length) {
      setError('请先选择文件。');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress({ value: 0.06, label: '准备处理' });
    trackEvent('process_start', {
      toolSlug: activeTool.slug,
      category: activeTool.category,
      inputType: files[0]?.type,
      outputType: activeTool.outputTypes?.[0]
    });

    try {
      const nextResult = await runActiveTool(activeTool.slug, files, nextOptions);
      setResult(nextResult);
      rememberResult(nextResult, nextOptions);
      trackEvent('process_success', {
        toolSlug: activeTool.slug,
        category: activeTool.category,
        outputType: nextResult.kind
      });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : '处理失败，请换个文件重试。';
      setError(message);
      trackEvent('process_fail', {
        toolSlug: activeTool.slug,
        category: activeTool.category,
        reason: message
      });
    } finally {
      setIsProcessing(false);
    }
  }

  async function runActiveTool(slug: string, selectedFiles: File[], nextOptions: CompressionOptions) {
    if (slug === 'photo-ocr') {
      setProgress({ value: 0.25, label: '加载 OCR 引擎' });
      const textResult = await ocrProcessor.process({
        file: selectedFiles[0],
        language: 'chi_sim+eng'
      });
      setProgress({ value: 1, label: '识别完成' });
      return textResult;
    }

    if (slug === 'scan-to-pdf') {
      setProgress({ value: 0.32, label: '整理图片页面' });
      const pdfResult = await createPdfFromImageFiles(selectedFiles.filter((file) => file.type.startsWith('image/')));
      setProgress({ value: 1, label: 'PDF 已生成' });
      return pdfResult;
    }

    if (slug === 'pdf-tools') {
      const pdfFiles = selectedFiles.filter((file) => file.type === 'application/pdf');
      if (pdfFiles.length >= 2) {
        setProgress({ value: 0.4, label: '合并 PDF 页面' });
        const pdfResult = await mergePdfFiles(pdfFiles);
        setProgress({ value: 1, label: 'PDF 已合并' });
        return pdfResult;
      }

      setProgress({ value: 0.32, label: '图片转 PDF' });
      const pdfResult = await createPdfFromImageFiles(selectedFiles.filter((file) => file.type.startsWith('image/')), 'pdf-tools');
      setProgress({ value: 1, label: 'PDF 已生成' });
      return pdfResult;
    }

    setProgress({ value: 0.2, label: '压缩图片' });
    const imageResult = await imageCompressor.process(
      { file: selectedFiles[0], options: nextOptions },
      (value, label) => setProgress({ value, label })
    );
    return imageResult;
  }

  function rememberResult(nextResult: ProcessingResult, nextOptions: CompressionOptions) {
    const fileName = nextResult.sourceFileName;
    const outputSize = nextResult.kind === 'text'
      ? new Blob([nextResult.copyableText], { type: 'text/plain' }).size
      : 'outputSize' in nextResult
        ? nextResult.outputSize
        : nextResult.outputBlob.size;
    const originalSize = files.reduce((total, file) => total + file.size, 0);
    const nextRecent = recentStore.add({
      id: nextResult.id,
      fileName,
      toolSlug: nextResult.toolSlug,
      toolName: activeTool?.name,
      createdAt: nextResult.createdAt,
      originalSize,
      outputSize,
      quality: nextOptions.quality,
      maxWidth: nextOptions.maxWidth,
      mimeType: nextResult.kind === 'image' ? nextResult.outputMimeType : 'image/jpeg'
    });
    setRecentTasks(nextRecent);
  }

  function exportResult() {
    if (!result) {
      return;
    }

    if (result.kind === 'text') {
      downloadBlob(new Blob([result.copyableText], { type: 'text/plain' }), result.outputFileName);
    } else {
      downloadBlob(result.outputBlob, result.outputFileName);
    }

    trackEvent('export_click', {
      toolSlug: result.toolSlug,
      outputType: result.kind
    });
  }

  async function copyTextResult() {
    if (result?.kind !== 'text') {
      return;
    }

    await navigator.clipboard.writeText(result.copyableText);
    trackEvent('export_click', {
      toolSlug: result.toolSlug,
      outputType: 'text',
      action: 'copy'
    });
  }

  return (
    <main>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">手机办公 · 文件处理 · 本地优先</p>
          <h1 id="hero-title">{PRODUCT_NAME}</h1>
          <p className="hero-text">
            把微信里常见的图片、文字和 PDF 任务压到三步内完成：拍图识字、扫描成 PDF、PDF 合并、图片轻处理。
          </p>
          <p className="hero-note">H5 首版已支持本地 OCR、PDF 与图片处理；小程序端图片工具可本机压缩，其余重任务请跳转 H5。</p>
        </div>
        <div className="metric-strip" aria-label="首版定位指标">
          <Metric label="主指标" value="完成并导出的办公任务数" />
          <Metric label="首批入口" value="OCR / 扫描 / PDF / 图片" />
          <Metric label="处理策略" value="本地优先，重任务后置" />
        </div>
      </section>

      <section className="workspace office-layout" aria-labelledby="workspace-title">
        <div className="section-heading">
          <p className="eyebrow">高频任务中心</p>
          <h2 id="workspace-title">选择一个任务，上传文件，拿结果</h2>
        </div>

        <div className="office-grid">
          <aside className="tool-rail" aria-label="工具入口">
            {launchTools.map((tool) => (
              <button
                className={`tool-card ${tool.slug === activeSlug ? 'active' : ''}`}
                key={tool.slug}
                type="button"
                onClick={() => switchTool(tool)}
              >
                <span>{tool.category?.toUpperCase()}</span>
                <strong>{tool.name}</strong>
                <small>{tool.tagline}</small>
              </button>
            ))}
          </aside>

          <section className="task-panel" aria-label={activeTool?.name}>
            <div className="task-header">
              <div>
                <p className="eyebrow">{activeTool?.processingMode === 'local' ? '本地处理' : '本地优先 / 可扩云能力'}</p>
                <h3>{activeTool?.name}</h3>
                <p>{activeTool?.tagline}</p>
              </div>
              <button className="secondary-button compact" type="button" onClick={() => fileInputRef.current?.click()}>
                选择文件
              </button>
            </div>

            {activeTool ? (
              <p className="capability-note">{getCapabilityBoundary(activeTool.slug)?.summary}</p>
            ) : null}

            <FileDropZone
              activeTool={activeTool}
              fileInputRef={fileInputRef}
              files={files}
              sourcePreview={sourcePreview}
              onFiles={handleFiles}
            />

            {activeSlug === 'image-tools' ? (
              <ImageControls options={options} onChange={setOptions} />
            ) : null}

            <button
              className="primary-button full"
              type="button"
              disabled={!files.length || isProcessing}
              onClick={() => processFiles()}
            >
              {isProcessing ? '处理中' : getPrimaryAction(activeSlug)}
            </button>

            {isProcessing ? (
              <div className="progress" aria-live="polite">
                <span>{progress.label}</span>
                <div>
                  <i style={{ width: `${Math.round(progress.value * 100)}%` }} />
                </div>
              </div>
            ) : null}
            {error ? <p className="error" role="alert">{error}</p> : null}
          </section>

          <ResultPanel
            result={result}
            activeTool={activeTool}
            recentTasks={recentTasks}
            onExport={exportResult}
            onCopyText={copyTextResult}
            onRepeat={() => processFiles()}
            onRelatedTool={(slug) => {
              const related = getToolBySlug(slug);
              if (!related) {
                return;
              }
              trackEvent('related_tool_click', {
                toolSlug: activeTool?.slug,
                category: activeTool?.category,
                relatedToolSlug: slug
              });
              switchTool(related);
            }}
            onReuseRecent={(task) => {
              if (task.toolSlug && getToolBySlug(task.toolSlug)) {
                switchTool(getToolBySlug(task.toolSlug)!);
              }
              setOptions({
                quality: task.quality,
                maxWidth: task.maxWidth,
                outputType: task.mimeType
              });
              trackEvent('reuse_click', {
                toolSlug: task.toolSlug ?? activeTool?.slug,
                category: activeTool?.category
              });
            }}
          />
        </div>
      </section>

      <section className="strategy-band" aria-labelledby="strategy-title">
        <div className="section-heading">
          <p className="eyebrow">产品取舍</p>
          <h2 id="strategy-title">不做完整工具箱，先做大众高频办公任务</h2>
        </div>
        <div className="strategy-grid">
          <article>
            <h3>首批做什么</h3>
            <p>拍图识字、扫描成 PDF、PDF 合并/图片转 PDF、图片轻处理。</p>
          </article>
          <article>
            <h3>暂时不做什么</h3>
            <p>{deferredCapabilities.join('；')}。</p>
          </article>
          <article>
            <h3>怎么判断方向</h3>
            <p>看上传完成率、处理成功率、导出率、二次访问率和相邻工具点击率。</p>
          </article>
        </div>
      </section>

      <section className="compliance" id="compliance" aria-labelledby="compliance-title">
        <div className="section-heading">
          <p className="eyebrow">合规基本盘</p>
          <h2 id="compliance-title">隐私、开源披露与风险提示</h2>
        </div>
        <div className="compliance-grid">
          <article>
            <h3>文件处理说明</h3>
            <p>首批能力默认本地处理；OCR 会加载浏览器识别引擎。后续如果接云 OCR，需补充上传、删除和授权说明。</p>
          </article>
          <article>
            <h3>开源披露</h3>
            <ul>
              {disclosures.map((item) => (
                <li key={item.name}>
                  <a href={item.repository} target="_blank" rel="noreferrer">
                    {item.name}
                  </a>{' '}
                  · {item.license}
                </li>
              ))}
            </ul>
          </article>
          <article>
            <h3>敏感信息提醒</h3>
            <p>票据、合同、证件、简历可能包含个人信息。产品内不做公开画廊，不默认上传，不强制登录。</p>
          </article>
        </div>
      </section>
    </main>
  );
}

function FileDropZone({
  activeTool,
  fileInputRef,
  files,
  sourcePreview,
  onFiles
}: {
  activeTool?: ToolManifest;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  files: File[];
  sourcePreview: string | null;
  onFiles: (files: File[]) => void;
}) {
  const acceptsPdf = activeTool?.inputTypes?.includes('pdf');
  const acceptsImage = activeTool?.inputTypes?.includes('image');
  const accept = [
    acceptsImage ? 'image/jpeg,image/png,image/webp' : '',
    acceptsPdf ? 'application/pdf' : ''
  ].filter(Boolean).join(',');
  const multiple = activeTool?.slug === 'scan-to-pdf' || activeTool?.slug === 'pdf-tools';

  return (
    <div
      className="upload-panel embedded"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        onFiles(Array.from(event.dataTransfer.files));
      }}
    >
      <input
        ref={fileInputRef}
        className="visually-hidden"
        type="file"
        accept={accept}
        multiple={multiple}
        capture={acceptsImage && !acceptsPdf ? 'environment' : undefined}
        onChange={(event) => onFiles(Array.from(event.target.files ?? []))}
      />
      <div className="upload-box">
        <span className="upload-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="img">
            <path d="M12 4v11" />
            <path d="m7 9 5-5 5 5" />
            <path d="M5 20h14" />
          </svg>
        </span>
        <h3>{files.length ? `${files.length} 个文件已选择` : '拖入文件或手动选择'}</h3>
        <p>{getInputHint(activeTool)}</p>
      </div>

      {sourcePreview ? (
        <div className="preview-block">
          <img src={sourcePreview} alt="输入图片预览" />
          <div>
            <strong>{files[0]?.name}</strong>
            <span>{formatBytes(files.reduce((total, file) => total + file.size, 0))}</span>
          </div>
        </div>
      ) : files.length ? (
        <div className="file-stack">
          {files.slice(0, 4).map((file) => (
            <span key={`${file.name}-${file.size}`}>
              {file.name} · {formatBytes(file.size)}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ImageControls({
  options,
  onChange
}: {
  options: CompressionOptions;
  onChange: (options: CompressionOptions) => void;
}) {
  return (
    <div className="control-panel compact-controls">
      <label>
        <span>压缩质量：{Math.round(options.quality * 100)}%</span>
        <input
          type="range"
          min={0.3}
          max={0.95}
          step={0.05}
          value={options.quality}
          onChange={(event) => onChange({ ...options, quality: Number(event.target.value) })}
        />
      </label>
      <label>
        <span>最长边：{options.maxWidth}px</span>
        <input
          type="range"
          min={640}
          max={2560}
          step={160}
          value={options.maxWidth}
          onChange={(event) => onChange({ ...options, maxWidth: Number(event.target.value) })}
        />
      </label>
      <div className="segmented">
        {(['image/jpeg', 'image/png', 'image/webp'] as SupportedMimeType[]).map((type) => (
          <button
            key={type}
            type="button"
            className={options.outputType === type ? 'active' : ''}
            onClick={() => onChange({ ...options, outputType: type })}
          >
            {formatMime(type)}
          </button>
        ))}
      </div>
    </div>
  );
}

function ResultPanel({
  result,
  activeTool,
  recentTasks,
  onExport,
  onCopyText,
  onRepeat,
  onRelatedTool,
  onReuseRecent
}: {
  result: ProcessingResult | null;
  activeTool?: ToolManifest;
  recentTasks: RecentTask[];
  onExport: () => void;
  onCopyText: () => void;
  onRepeat: () => void;
  onRelatedTool: (slug: string) => void;
  onReuseRecent: (task: RecentTask) => void;
}) {
  const relatedTools = activeTool?.relatedTools.filter((tool) => tool.status === 'available') ?? [];

  return (
    <aside className="result-panel office-result">
      <div>
        <p className="eyebrow">统一结果页</p>
        <h3>{result ? '处理完成' : `${activeTool?.name ?? '工具'} 的结果会出现在这里`}</h3>
      </div>

      {result ? (
        <ResultContent result={result as ImageResult | TextResult | PdfResult} />
      ) : (
        <p className="empty-inline">结果页会提供复制、下载、再次处理和相邻工具推荐，不让任务在“完成”处断掉。</p>
      )}

      {result ? (
        <div className="result-actions">
          {result.kind === 'text' ? (
            <button className="secondary-button" type="button" onClick={onCopyText}>
              复制文字
            </button>
          ) : null}
          <button className="primary-button" type="button" onClick={onExport}>
            导出结果
          </button>
          <button className="secondary-button" type="button" onClick={onRepeat}>
            再处理一次
          </button>
        </div>
      ) : null}

      {relatedTools.length ? (
        <div className="related-tools">
          <strong>下一步工具</strong>
          {relatedTools.map((tool) => (
            <button
              className="secondary-button full"
              key={tool.slug}
              type="button"
              onClick={() => onRelatedTool(tool.slug)}
            >
              {tool.name} · {tool.reason}
            </button>
          ))}
        </div>
      ) : null}

      <div className="recent-mini">
        <strong>最近记录</strong>
        {recentTasks.length ? (
          recentTasks.slice(0, 3).map((task) => (
            <button
              className="recent-chip"
              key={task.id}
              type="button"
              onClick={() => onReuseRecent(task)}
            >
              {task.toolName ? `${task.toolName} · ` : ''}
              {task.fileName} · {formatBytes(task.originalSize)} → {formatBytes(task.outputSize)}
            </button>
          ))
        ) : (
          <span>完成任务后保存最近 5 次本地记录。</span>
        )}
      </div>
    </aside>
  );
}

function ResultContent({ result }: { result: ImageResult | TextResult | PdfResult }) {
  if (result.kind === 'text') {
    return (
      <div className="text-result">
        <textarea readOnly value={result.copyableText} aria-label="OCR 识别结果" />
        <div className="result-stats">
          <Metric label="置信度" value={`${Math.round(result.confidence * 100)}%`} />
          <Metric label="耗时" value={`${(result.durationMs / 1000).toFixed(1)}s`} />
        </div>
      </div>
    );
  }

  if (result.kind === 'pdf') {
    return (
      <div className="pdf-result">
        <strong>{result.outputFileName}</strong>
        <div className="result-stats">
          <Metric label="页数" value={`${result.pageCount}`} />
          <Metric label="大小" value={formatBytes(result.outputSize)} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="result-media">
        <img src={result.previewUrl} alt={`${result.outputFileName} 处理结果预览`} />
      </div>
      <div className="result-stats">
        <Metric label="原图" value={formatBytes(result.originalSize)} />
        <Metric label="结果" value={formatBytes(result.outputSize)} />
        <Metric label="节省" value={`${result.compressionRate}%`} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function validateFilesForTool(files: File[], tool: ToolManifest): { valid: boolean; reason?: string } {
  if (!files.length) {
    return { valid: false, reason: '请先选择文件。' };
  }

  if (tool.slug === 'pdf-tools') {
    const allSupported = files.every((file) => file.type === 'application/pdf' || file.type === 'image/jpeg' || file.type === 'image/png');
    if (!allSupported) {
      return { valid: false, reason: 'PDF 工具首版支持 PDF、JPG、PNG；WebP 可先在图片工具中转成 JPG。' };
    }
    return { valid: true };
  }

  if (tool.slug === 'scan-to-pdf') {
    const unsupported = files.find((file) => file.type !== 'image/jpeg' && file.type !== 'image/png');
    if (unsupported) {
      return { valid: false, reason: '扫描成 PDF 首版仅支持 JPG/PNG 图片，WebP 可先转成 JPG。' };
    }
  }

  const invalidImage = files.find((file) => !file.type.startsWith('image/'));
  if (invalidImage) {
    return { valid: false, reason: `${tool.name} 需要选择图片文件。` };
  }

  for (const file of files) {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return validation;
    }
  }

  return { valid: true };
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function getPrimaryAction(slug: string) {
  if (slug === 'photo-ocr') return '开始识别';
  if (slug === 'scan-to-pdf') return '生成 PDF';
  if (slug === 'pdf-tools') return '处理 PDF';
  return '处理图片';
}

function getInputHint(tool?: ToolManifest) {
  if (!tool) return '选择文件后开始处理。';
  if (tool.slug === 'photo-ocr') return '上传一张清晰截图、票据或讲义照片。';
  if (tool.slug === 'scan-to-pdf') return '可一次选择多张图片，按顺序生成 PDF。';
  if (tool.slug === 'pdf-tools') return '选择多份 PDF 可合并；选择图片可转 PDF。';
  return '支持 JPG、PNG、WebP，适合压缩、改尺寸和格式转换。';
}

function formatMime(type: string) {
  return type.replace('image/', '').toUpperCase().replace('JPEG', 'JPG');
}
