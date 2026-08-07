import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  COHORT_DAYS,
  DAY_TYPES,
  type Curriculum,
  type CurriculumDay,
  type CurriculumModule,
  type DayType,
} from "./types";

const CURRICULUM_PATH = join(process.cwd(), "data", "curriculum.json");

/**
 * Immutable static data, read once per process. This is NOT session state —
 * the CLAUDE.md ban on module globals is about per-session data, which must
 * always round-trip through Supabase.
 */
let cached: Curriculum | null = null;

export function loadCurriculum(): Curriculum {
  if (cached) return cached;

  let raw: string;
  try {
    raw = readFileSync(CURRICULUM_PATH, "utf8");
  } catch {
    throw new Error(
      `Could not read ${CURRICULUM_PATH}. Drop curriculum.json into /data.`
    );
  }

  cached = validateCurriculum(JSON.parse(raw));
  return cached;
}

/** Exported for tests; also called on every load so bad data fails loudly. */
export function validateCurriculum(input: unknown): Curriculum {
  if (typeof input !== "object" || input === null) {
    throw new Error("curriculum.json: expected a top-level object");
  }

  const { modules, days } = input as Record<string, unknown>;

  if (!Array.isArray(days)) {
    throw new Error("curriculum.json: `days` must be an array");
  }
  if (days.length !== COHORT_DAYS) {
    throw new Error(
      `curriculum.json: expected ${COHORT_DAYS} days, found ${days.length}`
    );
  }
  if (!Array.isArray(modules)) {
    throw new Error("curriculum.json: `modules` must be an array");
  }

  for (const m of modules as CurriculumModule[]) {
    if (!Array.isArray(m.days) || m.days.length !== 2) {
      throw new Error(
        `curriculum.json: module.days must be a [start, end] pair, got ${JSON.stringify(m.days)}`
      );
    }
  }

  for (const d of days as CurriculumDay[]) {
    if (typeof d.day !== "number") {
      throw new Error(`curriculum.json: day missing numeric \`day\``);
    }
    if (!DAY_TYPES.includes(d.type)) {
      throw new Error(
        `curriculum.json: day ${d.day} has unknown type "${d.type}"`
      );
    }
    if (!Array.isArray(d.objectives)) {
      throw new Error(`curriculum.json: day ${d.day} missing \`objectives\``);
    }
    if (!Array.isArray(d.tools)) {
      throw new Error(`curriculum.json: day ${d.day} missing \`tools\``);
    }
  }

  return input as Curriculum;
}

/** Soft lookup — undefined when the day does not exist. */
export function findDay(n: number): CurriculumDay | undefined {
  return loadCurriculum().days.find((d) => d.day === n);
}

/** Hard lookup — throws, because targeting a nonexistent day is a bug. */
export function getDay(n: number): CurriculumDay {
  const day = findDay(n);
  if (!day) {
    throw new Error(`No curriculum day ${n} (expected 1-${COHORT_DAYS})`);
  }
  return day;
}

/**
 * Just this day's objectives. Turn prompts send these and nothing else —
 * the full curriculum never goes into a prompt (CLAUDE.md token discipline).
 */
export function getObjectives(n: number): string[] {
  return getDay(n).objectives;
}

/** Every day worth interviewing on: everything except SETUP (days 1-2). */
export function interviewableDays(): CurriculumDay[] {
  return loadCurriculum().days.filter((d) => d.type !== "SETUP");
}

export function daysOfType(type: DayType): CurriculumDay[] {
  return loadCurriculum().days.filter((d) => d.type === type);
}

/** Expands the [start, end] pair. Never iterate `module.days` directly. */
export function moduleDayNumbers(m: CurriculumModule): number[] {
  const [start, end] = m.days;
  const out: number[] = [];
  for (let d = start; d <= end; d++) out.push(d);
  return out;
}

export function moduleForDay(n: number): CurriculumModule | undefined {
  return loadCurriculum().modules.find((m) => n >= m.days[0] && n <= m.days[1]);
}
