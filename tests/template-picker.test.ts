import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { defaultResume } from '../src/data/defaultResume'
import { TemplatePicker } from '../src/components/TemplatePicker'
import { getTemplate, templates } from '../src/templates/registry'
import { previewDataFor } from '../src/templates/types'
import type { ResumeData } from '../src/types'

/**
 * The template library is where template switching happens, and every row is
 * rendered from live document data. Each row must therefore show the template
 * in its own catalog accent — the accent of the document being edited belongs
 * to the currently active template and must not leak into the other rows.
 * scripts/template-preview.tsx encodes the same rule ("Mimic 'just switched to
 * this template'"); this test pins it for the picker.
 *
 * The picker is a left list + right enlarged preview; the preview follows
 * hover/focus and defaults to the document's current template.
 */

function docWithAccent(accent: string): ResumeData {
  return { ...JSON.parse(JSON.stringify(defaultResume)), theme: { accent } }
}

function renderPicker(doc: ResumeData): string {
  // hooks inside the component require a real element tree, not a direct call
  return renderToStaticMarkup(
    createElement(TemplatePicker, { open: true, data: doc, onClose: () => {}, onPick: () => {} }),
  )
}

test('every library row renders in its own catalog accent', () => {
  const doc = docWithAccent('#E8462D') // custom colour, no template's default
  const html = renderPicker(doc)

  const rows = html.split('data-tpl-id').slice(1)
  assert.equal(rows.length, templates.length, 'one markup chunk per registered template')

  templates.forEach((t, i) => {
    assert.ok(
      rows[i].includes(`--blue:${t.accent}`),
      `row ${t.id} must render with its catalog accent ${t.accent}`,
    )
  })
})

test('the edited document accent never leaks into other library rows', () => {
  const doc = docWithAccent('#E8462D')
  const html = renderPicker(doc)
  assert.equal(html.includes('--blue:#E8462D'), false, 'no preview may inherit the doc accent')
})

test('the enlarged preview defaults to the current template, in its own accent', () => {
  const doc = docWithAccent('#E8462D')
  const html = renderPicker(doc)
  const current = getTemplate(doc.templateId)

  const stage = html.slice(html.indexOf('ed-tpl-stage-head'))
  assert.ok(stage.length > 0, 'picker must render the preview stage')
  assert.ok(stage.includes(current.nameZh), `stage should preview ${current.id} by default`)
  assert.ok(
    stage.includes(`--blue:${current.accent}`),
    `stage must show ${current.id} in its catalog accent`,
  )
})

test('previewDataFor shows a template in its own accent, keeping document content', () => {
  const doc = docWithAccent('#E8462D')
  for (const t of templates) {
    const preview = previewDataFor(t, doc)
    assert.equal(preview.theme.accent, t.accent)
    assert.equal(preview.templateId, t.id)
    assert.equal(preview.header.nameZh, doc.header.nameZh, 'content must be preserved')
  }
})
