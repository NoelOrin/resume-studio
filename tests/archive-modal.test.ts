import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ArchiveModal } from '../src/components/ArchiveModal'
import type { ArchiveRecord } from '../src/lib/backend'

function record(overrides: Partial<ArchiveRecord> = {}): ArchiveRecord {
  return {
    id: 'abc-1234',
    title: '林知远 · 简历',
    format: 'pdf',
    filename: '林知远 · 简历.pdf',
    bytes: 512 * 1024,
    createdAt: '2026-10-25T10:30:00.000Z',
    templateId: 'quiet',
    ...overrides,
  }
}

function renderModal(records: ArchiveRecord[]): string {
  return renderToStaticMarkup(
    createElement(ArchiveModal, {
      open: true,
      records,
      busy: false,
      onClose: () => {},
      onRefresh: () => {},
      onDelete: () => {},
      onClear: () => {},
    }),
  )
}

test('rows show the download name, format badge, readable size and template', () => {
  const html = renderModal([record()])
  assert.ok(html.includes('林知远 · 简历.pdf'))
  assert.ok(html.includes('ed-tag--pdf'), 'format badge is rendered')
  assert.ok(html.includes('512 KB'), 'size is human-readable')
  assert.ok(html.includes('色卡规格表'), 'template name is resolved from templateId')
  assert.ok(html.includes('href="/api/archive/abc-1234"'), 'download link targets the archive endpoint')
})

test('sizes span KB, MB and plain bytes', () => {
  const html = renderModal([
    record({ id: 'a-1', filename: 'a.json', format: 'json', bytes: 900 }),
    record({ id: 'a-2', filename: 'b.png', format: 'png', bytes: 3 * 1024 * 1024 }),
  ])
  assert.ok(html.includes('900 B'))
  assert.ok(html.includes('3.0 MB'))
})

test('an empty library explains itself', () => {
  const html = renderModal([])
  assert.ok(html.includes('还没有导出产物'))
  assert.ok(!html.includes('ed-doc-row'), 'no rows without records')
})

test('a closed modal renders nothing', () => {
  const html = renderToStaticMarkup(
    createElement(ArchiveModal, {
      open: false,
      records: [record()],
      busy: false,
      onClose: () => {},
      onRefresh: () => {},
      onDelete: () => {},
      onClear: () => {},
    }),
  )
  assert.equal(html, '')
})
