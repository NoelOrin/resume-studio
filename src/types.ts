export type Pair = { label: string; value: string }
export type Stat = { value: string; label: string }
export type Skill = { label: string; level: number }
export type StackGroup = { k: string; v: string }
export type Metric = { v: string; l: string }

export type Job = {
  roleZh: string
  roleEn: string
  company: string
  date: string
  bullets: string[]
}

export type Project = {
  name: string
  code: string
  kind: string
  desc: string
  stats: Metric[]
}

export type ResumeData = {
  version: 1
  theme: { accent: string }
  flags: { showYears: boolean; showStats: boolean; showFlow: boolean }
  strip: { a: string; b: string; rev: string; sheet: string; date: string }
  header: {
    brand: string
    brandSub: string
    nameZh: string
    nameEn: string
    tag: string
    titleZh: string
    titleEn: string
    status: string[]
    years: Stat
    contacts: Pair[]
  }
  profile: { no: string; kicker: string; text: string; stats: Stat[] }
  stack: { no: string; kicker: string; groups: StackGroup[]; skills: Skill[] }
  education: {
    no: string
    kicker: string
    school: string
    schoolMeta: string
    date: string
    degree: string
    items: string[]
  }
  experience: { no: string; title: string; zh: string; meta: string; jobs: Job[] }
  projects: { no: string; title: string; zh: string; meta: string; items: Project[] }
  flow: { label: string; steps: string[]; tag: string }
  footer: {
    product: string
    copyright: string
    word: string
    plateTop: string
    plateSub: string
    code: string
    sig: string
    edgeL: string
    edgeR: string
  }
}

export type DocRecord = {
  id: string
  title: string
  updatedAt: string | null
}
