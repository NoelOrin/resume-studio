import assert from 'node:assert/strict'
import { test } from 'node:test'
import { defaultResume } from '../src/data/defaultResume'
import { TEMPLATE_CATALOG } from '../src/templates/catalog'
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

test('catalog and registry cover the same template ids', () => {
  const catalogIds = TEMPLATE_CATALOG.map((t) => t.id).sort()
  const registryIds = templates.map((t) => t.id).sort()
  assert.deepEqual(registryIds, catalogIds)
})

test('template ids are unique and kebab-case', () => {
  const ids = templates.map((t) => t.id)
  assert.equal(new Set(ids).size, ids.length, 'duplicate template ids')
  for (const id of ids) {
    assert.match(id, /^[a-z][a-z0-9-]*$/, `id "${id}" must be kebab-case (used in .t-<id> CSS scope and file paths)`)
  }
})
