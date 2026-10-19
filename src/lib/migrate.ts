import { defaultResume } from "../data/defaultResume";
import type { ResumeData } from "../types";

/**
 * Accepts data from localStorage / JSON import / server and normalises it to the
 * current document version (v2 adds `templateId` for the multi-template system).
 */
export function migrateDocument(input: unknown): ResumeData | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Partial<ResumeData> & Record<string, unknown>;
  if (!raw.header || !raw.experience) return null;

  return {
    version: 2,
    templateId: typeof raw.templateId === "string" && raw.templateId ? raw.templateId : "industrial",
    theme: { ...defaultResume.theme, ...(raw.theme ?? {}) },
    flags: { ...defaultResume.flags, ...(raw.flags ?? {}) },
    strip: { ...defaultResume.strip, ...(raw.strip ?? {}) },
    header: { ...defaultResume.header, ...(raw.header ?? {}) },
    profile: { ...defaultResume.profile, ...(raw.profile ?? {}) },
    stack: { ...defaultResume.stack, ...(raw.stack ?? {}) },
    education: { ...defaultResume.education, ...(raw.education ?? {}) },
    experience: { ...defaultResume.experience, ...(raw.experience ?? {}) },
    projects: { ...defaultResume.projects, ...(raw.projects ?? {}) },
    flow: { ...defaultResume.flow, ...(raw.flow ?? {}) },
    footer: { ...defaultResume.footer, ...(raw.footer ?? {}) },
  } as ResumeData;
}
