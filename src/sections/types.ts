import type { ResumeData } from '../types'

export type SectionProps = {
  data: ResumeData
  update: (fn: (d: ResumeData) => ResumeData) => void
  mutate: (fn: (d: ResumeData) => ResumeData) => void
}
