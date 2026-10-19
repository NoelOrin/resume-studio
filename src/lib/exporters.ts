import { EXPORT_PAGE_CSS, SHEET_CSS } from '../styles/sheetCss'

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

/** Freeze the live sheet (including inline accent variable) into a standalone file. */
export function buildStandaloneHtml(sheet: Element, title: string): string {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${SHEET_CSS}${EXPORT_PAGE_CSS}</style>
</head>
<body>
${sheet.outerHTML}
</body>
</html>
`
}

export function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function exportJson(data: unknown, filename: string) {
  download(filename, JSON.stringify(data, null, 2), 'application/json;charset=utf-8')
}

export function exportHtml(sheet: Element, title: string, filename: string) {
  download(filename, buildStandaloneHtml(sheet, title), 'text/html;charset=utf-8')
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
