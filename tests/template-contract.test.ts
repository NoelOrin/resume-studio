import assert from 'node:assert/strict'
import { test } from 'node:test'
import { defaultResume } from '../src/data/defaultResume'
import { defineTemplate } from '../src/templates/factory'
import { templates } from '../src/templates/registry'
import { validateTemplate } from '../src/templates/validate'

/**
 * The authoring contract (docs/template-authoring.md), enforced on every
 * registered template. New templates are covered the moment they register —
 * a violation fails the suite before it can silently break overflow
 * detection, click-to-panel or print.
 */
test('every registered template satisfies the authoring contract', () => {
  assert.ok(templates.length > 0, 'no templates registered')
  for (const tpl of templates) {
    const result = validateTemplate(tpl, defaultResume)
    const report = result.issues.map((i) => `  [page ${i.page}] ${i.message}`).join('\n')
    assert.deepEqual(result.issues, [], `${tpl.id} violates the template contract:\n${report}`)
  }
})

test('template ids are unique and kebab-case', () => {
  const ids = templates.map((t) => t.id)
  assert.equal(new Set(ids).size, ids.length, 'duplicate template ids')
  for (const id of ids) {
    assert.match(id, /^[a-z][a-z0-9-]*$/, `id "${id}" must be kebab-case (used in .t-<id> CSS scope and file paths)`)
  }
})

test('defineTemplate rejects unscoped css at definition time', () => {
  assert.throws(
    () =>
      defineTemplate({
        id: 'valid-id',
        nameZh: '测试',
        description: '',
        pages: 1,
        accent: '#000000',
        css: '.other-scope h2{color:red}',
        render: () => null,
      }),
    /\.t-valid-id/,
  )
})

test('defineTemplate rejects non-kebab ids and derives name/tags defaults', () => {
  assert.throws(
    () =>
      defineTemplate({
        id: 'Bad_Id',
        nameZh: '测试',
        description: '',
        pages: 1,
        accent: '#000000',
        css: '.t-bad_id{}',
        render: () => null,
      }),
    /kebab-case/,
  )

  const tpl = defineTemplate({
    id: 'factory-demo',
    nameZh: '工厂演示',
    description: '',
    pages: 1,
    accent: '#000000',
    css: '.t-factory-demo{}',
    render: () => null,
  })
  assert.equal(tpl.name, 'FACTORY-DEMO')
  assert.deepEqual(tpl.tags, [])
  assert.equal(tpl.cssScope, undefined)
})

test('defineTemplate honours cssScope for shared implementations', () => {
  const tpl = defineTemplate({
    id: 'shared-variant',
    nameZh: '共享变体',
    description: '',
    pages: 1,
    accent: '#000000',
    cssScope: 'base-scope',
    css: '.t-base-scope{}',
    render: () => null,
  })
  assert.equal(tpl.cssScope, 'base-scope')
})
