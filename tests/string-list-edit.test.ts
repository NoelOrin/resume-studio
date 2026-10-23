import test from 'node:test'
import assert from 'node:assert/strict'
import type { ReactElement, ReactNode } from 'react'
import { Area, LineInput } from '../src/components/fields'
import { defaultResume } from '../src/data/defaultResume'
import { EducationSection } from '../src/sections/EducationSection'
import { ExperienceSection } from '../src/sections/ExperienceSection'
import { FooterSection } from '../src/sections/FooterSection'
import { IdentitySection } from '../src/sections/IdentitySection'
import type { SectionProps } from '../src/sections/types'
import type { ResumeData } from '../src/types'

/**
 * Regression cover for the string-list editors (certificates, status line,
 * process steps, job bullets).
 *
 * `patchAt()` merges objects: `{ ...item, ...patch }`. Handing it a plain string
 * spreads that string into an object keyed by character index, so the list entry
 * stops being a string and every template that renders it throws
 * "Objects are not valid as a React child" — a white screen. These tests drive
 * the real `onChange` handlers and require the document to stay well-typed.
 */

/** Walk a React element tree without a DOM (the sections under test use no hooks). */
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

type StringEditor = { value: string; onChange: (value: string) => void }

/** Every LineInput / Area element in the tree — editors bound to `string[]` entries. */
function stringEditors(tree: ReactNode): StringEditor[] {
  return elements(tree)
    .filter((element) => element.type === LineInput || element.type === Area)
    .map((element) => element.props as unknown as StringEditor)
}

/** Finds the `{0:'a',1:'b',…}` shape that `{ ...item, ...'text' }` produces. */
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

function harness(data: ResumeData) {
  let produced: ResumeData | null = null
  const apply = (fn: (d: ResumeData) => ResumeData) => {
    produced = fn(data)
  }
  return {
    props: { data, update: apply, mutate: apply } satisfies SectionProps,
    get produced() {
      return produced
    },
  }
}

/** Types one character into every string-list editor and requires a clean document. */
function assertTypingKeepsStrings(label: string, render: (props: SectionProps) => ReactNode) {
  const data = JSON.parse(JSON.stringify(defaultResume)) as ResumeData
  const store = harness(data)
  const editors = stringEditors(render(store.props))
  assert.ok(editors.length > 0, `${label}: expected at least one string-list editor`)

  editors.forEach((editor, index) => {
    const typed = `${editor.value}X`
    editor.onChange(typed)
    const next = store.produced
    assert.ok(next, `${label}: editor #${index} did not update the document`)
    const corrupted = characterIndexedObjectPath(next)
    assert.equal(corrupted, null, `${label}: editor #${index} corrupted ${corrupted} into a character-indexed object`)
    assert.ok(
      JSON.stringify(next).includes(JSON.stringify(typed)),
      `${label}: editor #${index} did not store the typed value as a plain string`,
    )
  })
}

test('教育与证书：编辑证书条目后仍是 string[]', () => {
  assertTypingKeepsStrings('education', (props) => EducationSection(props))
})

test('身份与联系：编辑状态行后仍是 string[]', () => {
  assertTypingKeepsStrings('identity', (props) => IdentitySection(props))
})

test('页脚与流程：编辑流程步骤后仍是 string[]', () => {
  assertTypingKeepsStrings('footer', (props) => FooterSection(props))
})

test('工作经历：编辑成果要点后仍是 string[]', () => {
  assertTypingKeepsStrings('experience', (props) => ExperienceSection(props))
})
