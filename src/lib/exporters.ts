import { EXPORT_PAGE_CSS, PAGE_CSS } from '../styles/pages'

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

/**
 * Freeze the rendered pages (all pages of the current template) into a
 * standalone HTML file that shares the template CSS but no app JS.
 */
export function buildStandaloneHtml(exportNode: Element, templateCss: string, title: string): string {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${PAGE_CSS}${templateCss}${EXPORT_PAGE_CSS}</style>
</head>
<body>
<div class="tpl-export">
${exportNode.innerHTML}
</div>
</body>
</html>
`
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function download(filename: string, content: string, mime: string) {
  downloadBlob(new Blob([content], { type: mime }), filename)
}

export function exportJson(data: unknown, filename: string) {
  download(filename, JSON.stringify(data, null, 2), 'application/json;charset=utf-8')
}

export function downloadHtml(html: string, filename: string) {
  download(filename, html, 'text/html;charset=utf-8')
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
