import test from 'node:test'
import assert from 'node:assert/strict'
import type { ReactElement, ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { defaultResume } from '../src/data/defaultResume'
import { migrateDocument } from '../src/lib/migrate'
import { pageCountOf } from '../src/templates/types'
import { templates } from '../src/templates/registry'
import { IdentitySection } from '../src/sections/IdentitySection'
import { ProfileSection } from '../src/sections/ProfileSection'
import { ExperienceSection } from '../src/sections/ExperienceSection'
import { ProjectsSection } from '../src/sections/ProjectsSection'
import { StackSection } from '../src/sections/StackSection'
import { EducationSection } from '../src/sections/EducationSection'
import { FooterSection } from '../src/sections/FooterSection'
import { ThemeSection } from '../src/sections/ThemeSection'
import type { ResumeData } from '../src/types'

/**
 * `migrateDocument` is the single choke point for every way a document can enter
 * the app (localStorage, JSON import, `?doc=`, REST, MCP). It used to be a
 * shallow `{...defaults, ...raw}` spread that validated no types, so one
 * wrong-typed field reached `.map` / `.split` / `.toLowerCase` during render and
 * white-screened the editor — or, for `?doc=<id>`, turned the shareable URL into
 * a permanent HTTP 500.
 *
 * These tests fuzz every field of the document with wrong-typed values and
 * require the normalised result to render every panel and every template.
 */

const PANELS: Record<string, (props: any) => ReactNode> = {
  identity: IdentitySection,
  profile: ProfileSection,
  experience: ExperienceSection,
  projects: ProjectsSection,
  stack: StackSection,
  education: EducationSection,
  footer: FooterSection,
  theme: ThemeSection,
}

const WRONG_VALUES: Record<string, unknown[]> = {
  string: [null, 42, {}, [], true],
  number: ['x', null, {}],
  boolean: ['x', null, 7],
  array: ['STRING', null, {}, 42, [null], [{}], ['ok', 7, null]],
  object: [null, 'STRING', [], 42],
}

function collectPaths(value: unknown, path = '', out: { path: string; type: string }[] = []) {
  if (Array.isArray(value)) {
    out.push({ path, type: 'array' })
    value.forEach((item, i) => collectPaths(item, `${path}[${i}]`, out))
    return out
  }
  if (value && typeof value === 'object') {
    out.push({ path, type: 'object' })
    for (const key of Object.keys(value)) collectPaths((value as any)[key], path ? `${path}.${key}` : key, out)
    return out
  }
  out.push({ path, type: typeof value })
  return out
}

function setPath(target: any, path: string, value: unknown) {
  const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.')
  let cursor = target
  for (let i = 0; i < keys.length - 1; i++) cursor = cursor[keys[i]]
  cursor[keys[keys.length - 1]] = value
}

function clone(): ResumeData {
  return JSON.parse(JSON.stringify(defaultResume)) as ResumeData
}

function sectionProps(data: ResumeData): any {
  const noop = () => {}
  return {
    data,
    update: noop,
    mutate: noop,
    reset: noop,
    templateName: 'T',
    templateId: 'industrial',
    pageCount: 1,
    onOpenTemplates: noop,
  }
}

function renderEverywhere(data: ResumeData) {
  for (const [panel, Section] of Object.entries(PANELS)) {
    renderToStaticMarkup(Section(sectionProps(data)) as ReactElement)
    void panel
  }
  for (const template of templates) {
    const pages = pageCountOf(template, data)
    for (let page = 0; page < pages; page++) {
      renderToStaticMarkup(template.render(data, page) as ReactElement)
    }
  }
}

/** Every leaf keeps the type the schema declares, and every array stays an array. */
function assertShapeMatches(migrated: unknown, reference: unknown, path = ''): void {
  if (Array.isArray(reference)) {
    assert.ok(Array.isArray(migrated), `${path}: expected an array, got ${typeof migrated}`)
    return
  }
  if (reference && typeof reference === 'object') {
    assert.ok(
      migrated && typeof migrated === 'object' && !Array.isArray(migrated),
      `${path}: expected an object, got ${JSON.stringify(migrated)?.slice(0, 40)}`,
    )
    for (const key of Object.keys(reference)) {
      assertShapeMatches((migrated as any)[key], (reference as any)[key], path ? `${path}.${key}` : key)
    }
    return
  }
  assert.equal(typeof migrated, typeof reference, `${path}: expected ${typeof reference}, got ${typeof migrated}`)
}

test('migrateDocument keeps a valid document byte-identical', () => {
  assert.deepEqual(migrateDocument(clone()), defaultResume)
})

test('migrateDocument still rejects non-documents', () => {
  for (const junk of [null, undefined, 0, 'x', [], true, {}, { header: {} }, { experience: {} }]) {
    assert.equal(migrateDocument(junk), null, `expected null for ${JSON.stringify(junk)}`)
  }
})

test('every wrong-typed field normalises into a renderable document', () => {
  const paths = collectPaths(defaultResume).filter((p) => p.path)
  assert.ok(paths.length > 40, 'expected a meaningful field matrix')

  const failures: string[] = []
  let cases = 0

  // renderEverywhere is a pure function of the migrated document, so matrix
  // entries whose normalised output is byte-identical only need one render.
  const rendered = new Set<string>()

  for (const { path, type } of paths) {
    for (const injected of WRONG_VALUES[type] ?? []) {
      cases++
      const raw = clone()
      setPath(raw, path, injected)

      let migrated: ResumeData | null = null
      try {
        migrated = migrateDocument(raw)
      } catch (error) {
        failures.push(`${path}=${JSON.stringify(injected)}: migrateDocument threw ${(error as Error).message}`)
        continue
      }
      if (!migrated) continue // rejected wholesale: the app falls back to the default document

      try {
        assertShapeMatches(migrated, defaultResume)
      } catch (error) {
        failures.push(`${path}=${JSON.stringify(injected)}: shape ${(error as Error).message}`)
        continue
      }

      const fingerprint = JSON.stringify(migrated)
      if (rendered.has(fingerprint)) continue
      rendered.add(fingerprint)

      try {
        renderEverywhere(migrated)
      } catch (error) {
        failures.push(`${path}=${JSON.stringify(injected)}: render threw ${(error as Error).message.split('\n')[0]}`)
      }
    }
  }

  assert.ok(cases > 300, `expected a broad matrix, ran ${cases}`)
  assert.deepEqual(failures.slice(0, 12), [], `${failures.length} of ${cases} mutations break the render`)
})
