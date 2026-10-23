import test from 'node:test'
import assert from 'node:assert/strict'
import type { ReactElement, ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { defaultResume } from '../src/data/defaultResume'
import { pageCountOf } from '../src/templates/types'
import { templates } from '../src/templates/registry'
import { Area, Field, LineInput, Toggle } from '../src/components/fields'
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
 * Every in-session edit goes through `update` / `mutate`, which never touch
 * `migrateDocument` — that is exactly how the `patchAt`-on-a-string bug turned a
 * certificate entry into `{0:'A',1:'W',…}` and white-screened the editor.
 *
 * This test drives every interactive handler in every panel, feeds the produced
 * document back into all panels and all templates, and requires that nothing
 * throws and no list entry decays into a character-indexed object. It is the
 * generic guard against the next bug of that shape, not just the one we found.
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

function clone(): ResumeData {
  return JSON.parse(JSON.stringify(defaultResume)) as ResumeData
}

function sectionProps(data: ResumeData, capture: (next: ResumeData) => void): any {
  const apply = (fn: (d: ResumeData) => ResumeData) => capture(fn(data))
  return {
    data,
    update: apply,
    mutate: apply,
    reset: () => {},
    templateName: 'INDUSTRIAL',
    templateId: 'industrial',
    pageCount: 1,
    onOpenTemplates: () => {},
  }
}

function elements(node: ReactNode, out: ReactElement[] = []): ReactElement[] {
  if (Array.isArray(node)) {
    for (const child of node) elements(child as ReactNode, out)
    return out
  }
  if (node === null || typeof node !== 'object') return out
  const element = node as ReactElement<{ children?: ReactNode }>
  if (!element.props) return out
  out.push(element)
  elements(element.props.children, out)
  return out
}

/** `{ ...item, ...'text' }` spreads a string into an object keyed by character index. */
function characterIndexedObjectPath(value: unknown, path = ''): string | null {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const found = characterIndexedObjectPath(value[i], `${path}[${i}]`)
      if (found) return found
    }
    return null
  }
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const keys = Object.keys(record)
  if (keys.length > 1 && keys.every((key) => /^\d+$/.test(key))) return path || '<root>'
  for (const key of keys) {
    const found = characterIndexedObjectPath(record[key], path ? `${path}.${key}` : key)
    if (found) return found
  }
  return null
}

function renderEverywhere(data: ResumeData) {
  for (const Section of Object.values(PANELS)) {
    renderToStaticMarkup(Section(sectionProps(data, () => {})) as ReactElement)
  }
  for (const template of templates) {
    const pages = pageCountOf(template, data)
    for (let page = 0; page < pages; page++) {
      renderToStaticMarkup(template.render(data, page) as ReactElement)
    }
  }
}

/** Handlers that take a value take it directly; DOM handlers take an event. */
function argumentFor(element: ReactElement): { arg: unknown; valueStyle: boolean } {
  const props = element.props as any
  const name = typeof element.type === 'function' ? (element.type as any).name : ''
  if (name === 'Toggle') return { arg: !props.checked, valueStyle: true }
  if (name === 'Field' || name === 'LineInput' || name === 'Area') return { arg: 'ZZ', valueStyle: true }
  if (element.type === Field || element.type === LineInput || element.type === Area) return { arg: 'ZZ', valueStyle: true }
  if (element.type === Toggle) return { arg: !props.checked, valueStyle: true }
  return { arg: { target: { value: '9', checked: true }, preventDefault() {}, stopPropagation() {} }, valueStyle: false }
}

test('every panel handler produces a document that still renders', () => {
  const problems: string[] = []
  let invoked = 0

  for (const [panel, Section] of Object.entries(PANELS)) {
    const data = clone()
    let produced: ResumeData | null = null
    let tree: ReactElement
    try {
      // Build the tree with a *capturing* store: each handler closes over this
      // `capture`, so invoking it hands us the document the edit would produce.
      tree = Section(sectionProps(data, (next) => { produced = next })) as ReactElement
    } catch (error) {
      problems.push(`${panel}: rendering the panel threw ${(error as Error).message}`)
      continue
    }

    const targets = elements(tree).map((element) => {
      const props = element.props as any
      const name = typeof element.type === 'function' ? (element.type as any).name || 'fn' : String(element.type)
      const props_to_drive: { label: string; prop: 'onChange' | 'onClick'; valueStyle: boolean }[] = []
      if (typeof props.onChange === 'function') {
        props_to_drive.push({ label: `${name}.onChange`, prop: 'onChange', valueStyle: argumentFor(element).valueStyle })
      }
      if (typeof props.onClick === 'function') {
        props_to_drive.push({ label: `${name}.onClick`, prop: 'onClick', valueStyle: false })
      }
      return { element, props_to_drive }
    })

    for (const { element, props_to_drive } of targets) {
      for (const target of props_to_drive) {
        invoked++
        produced = null
        const props = element.props as any
        const { arg } = argumentFor(element)
        try {
          if (target.prop === 'onChange') props.onChange(arg)
          else props.onClick(arg)
        } catch (error) {
          problems.push(`${panel} ${target.label}: handler threw ${(error as Error).message}`)
          continue
        }
        if (!produced) continue // handler is a pure UI action (close/open modal), nothing to check
        const next: ResumeData = produced
        const corrupted = characterIndexedObjectPath(next)
        if (corrupted && target.valueStyle) {
          problems.push(`${panel} ${target.label}: corrupted ${corrupted} into a character-indexed object`)
        }
        try {
          renderEverywhere(next)
        } catch (error) {
          problems.push(`${panel} ${target.label}: produced document fails to render — ${(error as Error).message.split('\n')[0]}`)
        }
      }
    }
  }

  assert.ok(invoked > 100, `expected to exercise the panels broadly, invoked ${invoked} handlers`)
  assert.deepEqual(problems.slice(0, 10), [], `${problems.length} panel handlers produce a broken document`)
})

test('the default document renders in every panel and every template page', () => {
  assert.doesNotThrow(() => renderEverywhere(clone()))
})
