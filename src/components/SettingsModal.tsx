import { useCallback, useEffect, useRef, useState } from 'react'
import { Btn } from './fields'
import { APP_REPO, APP_VERSION } from '../lib/version'
import { fetchMcpInfo } from '../lib/backend'
import type { McpInfo } from '../lib/backend'
import { probeMcpEndpoint } from '../mcp/selftest'
import type { McpProbeResult } from '../mcp/selftest'
import type { UpdateCheck } from '../lib/update'
import type { UpdateCheckState } from '../lib/useUpdateCheck'

function formatTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * GitHub tags carry their own `v` (`v2.2.0`) while `current` does not
 * (`2.1.0`), so normalise before prepending one — otherwise the dialog reads
 * `vv2.2.0`. Non-numeric tags (`nightly`) are shown verbatim rather than
 * dressed up as `vnightly`.
 */
export function formatVersionLabel(raw: string | null | undefined): string {
  const tag = typeof raw === 'string' ? raw.trim() : ''
  if (!tag) return '—'
  const stripped = tag.replace(/^[vV]/, '')
  return /^\d/.test(stripped) ? `v${stripped}` : tag
}

export type McpState = 'idle' | 'loading' | 'ready' | 'error'
type CopyFn = (text: string, okMsg: string) => void

type SelfTestState = 'idle' | 'running' | 'done'

/**
 * One-click endpoint probe: the browser speaks bare JSON-RPC over fetch, so it
 * can verify reachability, server identity and tool count without any client
 * setup. A 401 means "endpoint reachable, token required" — expected when
 * RESUME_MCP_TOKEN is set, since the browser cannot carry the token.
 */
function McpSelfTest({ endpoint }: { endpoint: string }) {
  const [state, setState] = useState<SelfTestState>('idle')
  const [result, setResult] = useState<McpProbeResult | null>(null)

  const run = useCallback(async () => {
    setState('running')
    // probeMcpEndpoint catches network failures into its result; it does not throw.
    const probe = await probeMcpEndpoint(endpoint)
    setResult(probe)
    setState('done')
  }, [endpoint])

  return (
    <div>
      <div className="ed-set-actions">
        <Btn small variant="ghost" onClick={() => void run()} disabled={state === 'running'}>
          {state === 'running' ? '测试中…' : '测试连接'}
        </Btn>
      </div>

      {state === 'done' && result && (
        result.ok ? (
          <p className="ed-note">
            自检通过：{result.serverName ?? '未知服务'} {formatVersionLabel(result.serverVersion)} ·{' '}
            {result.toolCount ?? '?'} 个工具 · initialize {result.initMs}ms / tools/list{' '}
            {result.listMs}ms
          </p>
        ) : result.authRequired ? (
          <p className="ed-note">
            <span className="is-warn">端点可达（HTTP 401）</span>
            ：已启用 Bearer Token，浏览器自检无法携带 token。这是预期现象——请在 MCP 客户端配置
            Authorization 后使用。
          </p>
        ) : (
          <p className="ed-set-status is-err">
            自检失败：{result.error ?? '未知错误'}。请确认服务正在运行，且浏览器 Origin
            在允许列表内（RESUME_MCP_ALLOWED_ORIGINS）。
          </p>
        )
      )}
    </div>
  )
}

/**
 * Everything this app exposes over MCP, with a ready-to-paste 调用词 for every
 * tool / resource / prompt. Split out of the dialog so each state can be
 * rendered (and checked) on its own.
 */
export function McpSection({
  state,
  info,
  error,
  onRetry,
  copy,
}: {
  state: McpState
  info: McpInfo | null
  error: string | null
  onRetry: () => void
  copy: CopyFn
}) {
  return (
    <section className="ed-set-block">
      <div className="ed-set-head">
        <b>MCP 能力</b>
        <span>MCP / capabilities</span>
      </div>

      {state === 'loading' && <p className="ed-note">正在读取 MCP 能力…</p>}

      {state === 'error' && (
        <>
          <p className="ed-set-status is-err">{error || '读取 MCP 能力失败，请稍后重试'}</p>
          <div className="ed-set-actions">
            <Btn small variant="ghost" onClick={onRetry}>
              重试
            </Btn>
          </div>
        </>
      )}

      {state === 'ready' && info && (
        <>
          <div className="ed-mcp-endpoint">
            <span className="ed-mcp-label">端点</span>
            <code className="ed-mcp-endpoint-url">{info.endpoint}</code>
            <Btn small variant="ghost" onClick={() => copy(info.endpoint, 'MCP 端点已复制')} title="复制端点地址">
              复制
            </Btn>
          </div>

          <p className="ed-mcp-meta">
            <span>{info.transport}</span>
            <span className={info.authRequired ? 'is-warn' : ''}>
              {info.authRequired ? '需要 Bearer Token' : '本地免鉴权'}
            </span>
            <span>
              {info.serverName} {formatVersionLabel(info.version)}
            </span>
          </p>

          <McpSelfTest endpoint={info.endpoint} />

          <p className="ed-note">
            把上面的端点填进任意 MCP 客户端，AI 就能直接读写这里的简历。读取于 {formatTime(info.checkedAt)}。
          </p>

          <div className="ed-mcp-group">
            <div className="ed-mcp-group-head">
              <b>客户端配置</b>
              <span>{info.clients.length}</span>
            </div>
            {info.clients.map((client) => (
              <div className="ed-mcp-item" key={client.label}>
                <div className="ed-mcp-item-head">
                  <b>{client.label}</b>
                  <Btn small variant="ghost" onClick={() => copy(client.snippet, '配置片段已复制')}>
                    复制
                  </Btn>
                </div>
                <p className="ed-note">{client.note}</p>
                <pre className="ed-mcp-code">{client.snippet}</pre>
              </div>
            ))}
          </div>

          <div className="ed-mcp-group">
            <div className="ed-mcp-group-head">
              <b>工具</b>
              <span>{info.tools.length}</span>
            </div>
            {info.tools.map((tool) => (
              <div className="ed-mcp-item" key={tool.name}>
                <div className="ed-mcp-item-head">
                  <b>
                    <code className="ed-mcp-name">{tool.name}</code>
                    {tool.title}
                  </b>
                  <Btn small variant="ghost" onClick={() => copy(tool.example, '调用词已复制')}>
                    复制调用词
                  </Btn>
                </div>
                <p className="ed-mcp-desc">{tool.description}</p>
                <p className="ed-note">适用：{tool.whenToUse}</p>
                <p className="ed-mcp-example">
                  <span>调用词</span>
                  {tool.example}
                </p>
              </div>
            ))}
          </div>

          <div className="ed-mcp-group">
            <div className="ed-mcp-group-head">
              <b>资源</b>
              <span>{info.resources.length}</span>
            </div>
            {info.resources.map((resource) => (
              <div className="ed-mcp-item" key={resource.uri}>
                <div className="ed-mcp-item-head">
                  <b>
                    <code className="ed-mcp-name">{resource.uri}</code>
                    {resource.title}
                  </b>
                  <Btn small variant="ghost" onClick={() => copy(resource.example, '调用词已复制')}>
                    复制调用词
                  </Btn>
                </div>
                <p className="ed-mcp-desc">{resource.description}</p>
                <p className="ed-mcp-example">
                  <span>调用词</span>
                  {resource.example}
                </p>
              </div>
            ))}
          </div>

          <div className="ed-mcp-group">
            <div className="ed-mcp-group-head">
              <b>提示词</b>
              <span>{info.prompts.length}</span>
            </div>
            {info.prompts.map((prompt) => (
              <div className="ed-mcp-item" key={prompt.name}>
                <div className="ed-mcp-item-head">
                  <b>
                    <code className="ed-mcp-name">{prompt.name}</code>
                    {prompt.title}
                  </b>
                  <Btn small variant="ghost" onClick={() => copy(prompt.example, '调用词已复制')}>
                    复制调用词
                  </Btn>
                </div>
                <p className="ed-mcp-desc">{prompt.description}</p>
                {prompt.args.length > 0 && (
                  <ul className="ed-mcp-args">
                    {prompt.args.map((arg) => (
                      <li key={arg.name}>
                        <code className="ed-mcp-name">{arg.name}</code>
                        <em className={arg.required ? 'is-req' : ''}>{arg.required ? '必填' : '可选'}</em>
                        <span>{arg.description}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="ed-mcp-example">
                  <span>调用词</span>
                  {prompt.example}
                </p>
              </div>
            ))}
          </div>

          <div className="ed-mcp-group">
            <div className="ed-mcp-group-head">
              <b>通用调用词</b>
              <span>{info.examples.length}</span>
            </div>
            {info.examples.map((example) => (
              <div className="ed-mcp-example-row" key={example}>
                <span>{example}</span>
                <Btn small variant="ghost" onClick={() => copy(example, '调用词已复制')}>
                  复制
                </Btn>
              </div>
            ))}
          </div>

          <details className="ed-mcp-details">
            <summary>服务端说明与推荐工作流</summary>
            <div className="ed-mcp-details-body">
              <ol className="ed-mcp-workflow">
                {info.workflow.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <pre className="ed-mcp-code ed-mcp-code--block">{info.instructions}</pre>
              <div className="ed-set-actions">
                <Btn small variant="ghost" onClick={() => copy(info.instructions, '服务端说明已复制')}>
                  复制说明
                </Btn>
              </div>
            </div>
          </details>
        </>
      )}
    </section>
  )
}

/**
 * Top-bar settings dialog: about + update check + MCP capabilities.
 *
 * Update checking lives in `useUpdateCheck`; this component is fully
 * controlled so the toolbar entry can show the "new version" dot on its own.
 * The MCP catalog is fetched here on first open (it needs no parent state).
 * Desktop WKWebView may swallow `window.open`, so every value ships a copy
 * button as the fallback action.
 */
export function SettingsModal({
  open,
  onClose,
  state,
  check,
  error,
  onCheck,
  notify,
}: {
  open: boolean
  onClose: () => void
  state: UpdateCheckState
  check: UpdateCheck | null
  error: string | null
  onCheck: () => void
  notify: (msg: string, kind?: 'ok' | 'err') => void
}) {
  const [mcpState, setMcpState] = useState<McpState>('idle')
  const [mcpInfo, setMcpInfo] = useState<McpInfo | null>(null)
  const [mcpError, setMcpError] = useState<string | null>(null)

  const aliveRef = useRef(true)
  const mcpBusyRef = useRef(false)
  const mcpAbortRef = useRef<AbortController | null>(null)
  const mcpAttemptedRef = useRef(false)

  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
      mcpAbortRef.current?.abort()
      mcpAbortRef.current = null
      mcpBusyRef.current = false
    }
  }, [])

  const loadMcp = useCallback(async (): Promise<void> => {
    if (mcpBusyRef.current) return
    mcpBusyRef.current = true

    const ctrl = new AbortController()
    mcpAbortRef.current = ctrl
    setMcpState('loading')
    setMcpError(null)

    try {
      const info = await fetchMcpInfo(ctrl.signal)
      if (!aliveRef.current) return
      setMcpInfo(info)
      setMcpState('ready')
    } catch (err) {
      if (!aliveRef.current) return
      if (err instanceof DOMException && err.name === 'AbortError') return
      const detail = err instanceof Error ? err.message.trim() : ''
      setMcpState('error')
      setMcpError(detail ? `读取 MCP 能力失败：${detail.slice(0, 120)}` : '读取 MCP 能力失败，请稍后重试')
    } finally {
      if (mcpAbortRef.current === ctrl) mcpAbortRef.current = null
      mcpBusyRef.current = false
    }
  }, [])

  // Fetch once per open; the retry button calls `loadMcp` directly.
  useEffect(() => {
    if (!open) {
      mcpAttemptedRef.current = false
      return
    }
    if (mcpAttemptedRef.current) return
    mcpAttemptedRef.current = true
    void loadMcp()
  }, [open, loadMcp])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const repoUrl = `https://github.com/${APP_REPO}`
  const busy = state === 'checking'
  const latest = check?.latest ?? null
  const hasUpdate = Boolean(check?.hasUpdate)
  const downloadUrl = check?.downloadUrl ?? check?.releaseUrl ?? null

  const copyValue = async (text: string, okMsg: string, errMsg = '复制失败，请手动选中复制') => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable')
      await navigator.clipboard.writeText(text)
      notify(okMsg)
    } catch {
      notify(errMsg, 'err')
    }
  }

  const openDownload = () => {
    if (!downloadUrl) return
    // Do NOT pass `noopener` in the features string: per spec that makes
    // `window.open` return null even when the tab opens, which would look like a
    // blocked popup on every successful click. Sever `opener` by hand instead.
    const opened = window.open(downloadUrl, '_blank')
    if (opened) {
      try {
        opened.opener = null
      } catch {
        /* cross-origin: the reference is already useless to us */
      }
      return
    }
    // WKWebView / popup blockers return null: tell the user to copy instead.
    notify('浏览器拦截了新窗口，请改用「复制链接」', 'err')
  }

  const copyLink = () => copyValue(downloadUrl ?? '', '下载链接已复制', '复制失败，请手动复制')

  const statusText =
    state === 'checking'
      ? '检查中…'
      : state === 'error'
        ? error || '检查更新失败，请稍后重试'
        : state === 'idle'
          ? '尚未检查更新'
          : hasUpdate
            ? `发现新版本 ${formatVersionLabel(latest)}`
            : latest
              ? '已是最新版本'
              : '暂无可用的发布版本'

  return (
    <div className="ed-overlay" role="dialog" aria-modal="true" aria-label="设置" onClick={onClose}>
      <div className="ed-modal ed-modal--settings" onClick={(event) => event.stopPropagation()}>
        <div className="ed-modal-head">
          <div>
            <div className="ed-modal-kicker">SETTINGS / preferences</div>
            <h2>设置</h2>
          </div>
          <button type="button" className="ed-icon" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>

        <div className="ed-modal-body">
          <section className="ed-set-block">
            <div className="ed-set-head">
              <b>关于</b>
              <span>ABOUT</span>
            </div>
            <div className="ed-set-row">
              <span>应用</span>
              <b>RESUME STUDIO</b>
            </div>
            <div className="ed-set-row">
              <span>当前版本</span>
              <b className="ed-set-mono">{formatVersionLabel(APP_VERSION)}</b>
            </div>
            <div className="ed-set-row">
              <span>开源仓库</span>
              <a className="ed-set-link" href={repoUrl} target="_blank" rel="noreferrer noopener">
                {APP_REPO}
              </a>
            </div>
          </section>

          <section className="ed-set-block">
            <div className="ed-set-head">
              <b>检查更新</b>
              <span>UPDATE</span>
            </div>

            <div className="ed-set-versions">
              <div className="ed-set-version">
                <span>当前版本</span>
                <b>{formatVersionLabel(APP_VERSION)}</b>
              </div>
              <i className="ed-set-arrow" aria-hidden="true">
                →
              </i>
              <div className="ed-set-version">
                <span>最新版本</span>
                <b className={hasUpdate ? 'is-new' : ''}>{formatVersionLabel(latest)}</b>
              </div>
            </div>

            <p className={`ed-set-status${state === 'error' ? ' is-err' : ''}${hasUpdate ? ' is-new' : ''}`}>
              {statusText}
            </p>

            {state === 'idle' && <p className="ed-note">点击下方「检查更新」获取最新版本信息。</p>}

            {state === 'error' && (
              <div className="ed-set-actions">
                <Btn small variant="ghost" onClick={onCheck} disabled={busy}>
                  重试
                </Btn>
              </div>
            )}

            {state === 'ready' && hasUpdate && (
              <>
                <div className="ed-set-row">
                  <span>发布日期</span>
                  <b className="ed-set-mono">{formatTime(check?.publishedAt)}</b>
                </div>
                {check?.downloadName && (
                  <div className="ed-set-row">
                    <span>安装包</span>
                    <b className="ed-set-mono">{check.downloadName}</b>
                  </div>
                )}

                {check?.notes ? (
                  <div className="ed-set-notes" tabIndex={0}>
                    {check.notes}
                  </div>
                ) : (
                  <p className="ed-note">该版本没有提供更新说明。</p>
                )}

                <input
                  className="ed-input ed-mono ed-set-url"
                  value={downloadUrl ?? ''}
                  readOnly
                  aria-label="下载链接"
                  onFocus={(event) => event.currentTarget.select()}
                />

                <div className="ed-set-actions">
                  <Btn small variant="primary" onClick={openDownload} disabled={!downloadUrl}>
                    前往下载
                  </Btn>
                  <Btn small variant="ghost" onClick={() => void copyLink()} disabled={!downloadUrl}>
                    复制链接
                  </Btn>
                </div>
                {downloadUrl ? (
                  <p className="ed-note">桌面版若无法直接打开浏览器，请点「复制链接」后手动粘贴到浏览器下载。</p>
                ) : (
                  <p className="ed-note">该版本没有附带安装包，请到 Releases 页面手动下载。</p>
                )}
              </>
            )}

            {state === 'ready' && !hasUpdate && check?.error && <p className="ed-note">{check.error}</p>}
          </section>

          <McpSection
            state={mcpState}
            info={mcpInfo}
            error={mcpError}
            onRetry={() => void loadMcp()}
            copy={(text, okMsg) => void copyValue(text, okMsg)}
          />
        </div>

        <div className="ed-modal-foot">
          <Btn small variant="ghost" onClick={onCheck} disabled={busy}>
            {busy ? '检查中…' : '检查更新'}
          </Btn>
          <span className="ed-spacer" />
          <Btn small variant="primary" onClick={onClose}>
            关闭
          </Btn>
        </div>
      </div>
    </div>
  )
}
