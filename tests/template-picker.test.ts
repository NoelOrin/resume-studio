import test from 'node:test'
import assert from 'node:assert/strict'
import { renderToStaticMarkup } from 'react-dom/server'
import { defaultResume } from '../src/data/defaultResume'
import { TemplatePicker } from '../src/components/TemplatePicker'
import { templates } from '../src/templates/registry'
import { previewDataFor } from '../src/templates/types'
import type { ResumeData } from '../src/types'

/**
 * The template library is where template switching happens, and every card is
 * rendered from live document data. Each card must therefore show the template
 * in its own catalog accent — the accent of the document being edited belongs
 * to the currently active template and must not leak into the other cards.
 * scripts/template-preview.tsx encodes the same rule ("Mimic 'just switched to
 * this template'"); this test pins it for the picker.
 */

function docWithAccent(accent: string): ResumeData {
  return { ...JSON.parse(JSON.stringify(defaultResume)), theme: { accent } }
}

test('every library card renders in its own catalog accent', () => {
  const doc = docWithAccent('#E8462D') // custom colour, no template's default
  const html = renderToStaticMarkup(
    TemplatePicker({ open: true, data: doc, onClose: () => {}, onPick: () => {} }) as any,
  )

  const cards = html.split('ed-tpl-card').slice(1)
  assert.equal(cards.length, templates.length, 'one markup chunk per registered template')

  templates.forEach((t, i) => {
    assert.ok(
      cards[i].includes(`--blue:${t.accent}`),
      `card ${t.id} must render with its catalog accent ${t.accent}`,
    )
  })
})

test('the edited document accent never leaks into other library cards', () => {
  const doc = docWithAccent('#E8462D')
  const html = renderToStaticMarkup(
    TemplatePicker({ open: true, data: doc, onClose: () => {}, onPick: () => {} }) as any,
  )
  assert.equal(html.includes('--blue:#E8462D'), false, 'no card may inherit the doc accent')
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
