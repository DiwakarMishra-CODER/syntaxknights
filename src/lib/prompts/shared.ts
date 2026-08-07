import { loadCurriculum } from "../curriculum";
import type { Claim } from "../types";

/**
 * Anti-invention: the one failure mode this system keeps producing.
 *
 * Seen twice, in two different prompts, from the same cause — sparse input
 * plus a schema demanding a filled field, so the model supplies plausible
 * detail rather than admitting it has none:
 *
 *   1. The Planner invented that Harold "passed day 25 on a standard
 *      attempt". Day 25 is not in his mission record at all.
 *   2. The turn call extracted the claim "configured termination grace
 *      period to handle active streaming sessions" from a candidate who
 *      said only "we set it up properly so sessions keep working".
 *
 * Treated as a systemic risk rather than two bugs: this constant goes into
 * every prompt that converts input into a structured record, and the
 * verification below enforces it in code, because a prompt rule is a
 * request and validation is a guarantee.
 */
export const ANTI_INVENTION = `GROUNDING — THE HARDEST RULE, AND THE ONE MOST OFTEN BROKEN.

You may only state what is present in the input you were given. Never infer, assume, or fill a gap with a plausible-sounding detail. Absence of information is information: it means you know NOTHING about that thing, not that it went well or was handled competently.

When the input is thin, your output must be thin. A vague answer produces a vague claim. An empty field is always better than an invented one.

Two real failures from this system, so you can recognise the shape:

- A day was missing from a candidate's mission record, and the output claimed they "passed it on a standard attempt". The record did not say that. Nothing said that. It was invented to fill the field.
- A candidate said "we set it up properly so sessions keep working". The output recorded the claim "configured termination grace period to handle active streaming sessions". The candidate never said "termination grace period". That phrase was supplied by the model, and every later turn then probed against a fact that did not exist.

The test to apply to every field you emit: could I point at the exact words in the input that support this? If not, do not write it. Quote or closely paraphrase what was actually said. If they hand-waved, record the hand-wave.

Never name a mechanism, tool, number, or technique that does not appear in the input. Never ask a question that presupposes one.`;

// ---------------------------------------------------------------------------
// Code-level enforcement
// ---------------------------------------------------------------------------

/**
 * Technical vocabulary that must be earned. A claim may paraphrase freely
 * in ordinary English, but if it names one of these it has to be a term the
 * candidate actually used — that is exactly what "termination grace period"
 * violated.
 *
 * Seeded from the curriculum's own tools so it tracks the real syllabus,
 * plus infrastructure and ML vocabulary the cohort's build attracts.
 */
const EXTRA_TECHNICAL_TERMS = [
  "termination grace period",
  "grace period",
  "connection draining",
  "sticky session",
  "readiness probe",
  "liveness probe",
  "health check",
  "rolling update",
  "blue-green",
  "canary",
  "sidecar",
  "service mesh",
  "circuit breaker",
  "backpressure",
  "idempotent",
  "sharding",
  "replica",
  "autoscaling",
  "load balancer",
  "reverse proxy",
  "cosine similarity",
  "euclidean",
  "hnsw",
  "ivf",
  "reranking",
  "reranker",
  "chunking",
  "chunk size",
  "chunk overlap",
  "embedding",
  "vector database",
  "vector store",
  "quantization",
  "lora",
  "qlora",
  "fine-tuning",
  "distillation",
  "temperature",
  "top-k",
  "top-p",
  "beam search",
  "context window",
  "token limit",
  "prompt injection",
  "jailbreak",
  "guardrail",
  "redaction",
  "phi",
  "hipaa",
  "encryption at rest",
  "tls",
  "oauth",
  "rbac",
  "audit log",
  "rate limit",
  "exponential backoff",
  "webhook",
  "message queue",
  "pub/sub",
  "cron",
  "migration",
  "index",
  "foreign key",
  "transaction",
  "deadlock",
  "connection pool",
  "cache invalidation",
  "ttl",
  "cdn",
  "websocket",
  "streaming",
  "batching",
  "checkpoint",
  "rollback",
];

let glossary: string[] | null = null;

/** Curriculum tools plus the curated list, longest phrases first. */
export function technicalTerms(): string[] {
  if (glossary) return glossary;

  const fromCurriculum = loadCurriculum()
    .days.flatMap((d) => d.tools)
    .map((t) => t.toLowerCase().trim())
    .filter((t) => t.length >= 3);

  glossary = [...new Set([...fromCurriculum, ...EXTRA_TECHNICAL_TERMS])].sort(
    (a, b) => b.length - a.length
  );
  return glossary;
}

/**
 * Lowercase, strip punctuation, collapse whitespace, pad with spaces so
 * word-boundary checks are plain substring tests.
 *
 * Dots survive only between digits ("3.5", "0.75"). A sentence-final dot
 * would otherwise glue itself to the word and break every match — that is
 * what made "health checks." fail to match the term "health check".
 */
export function normalise(text: string): string {
  return ` ${text
    .toLowerCase()
    .replace(/[^a-z0-9+/\-. ]/g, " ")
    .replace(/(?<!\d)\.|\.(?!\d)/g, " ")
    .replace(/\s+/g, " ")
    .trim()} `;
}

function mentions(haystack: string, term: string): boolean {
  const t = normalise(term).trim();
  if (t.length === 0) return false;
  if (haystack.includes(` ${t} `)) return true;
  // tolerate simple plurals in either direction
  if (haystack.includes(` ${t}s `)) return true;
  if (t.endsWith("s") && haystack.includes(` ${t.slice(0, -1)} `)) return true;
  return false;
}

export interface ClaimCheck {
  claim: Claim;
  supported: boolean;
  /** Technical terms present in the claim but absent from the source. */
  unsupportedTerms: string[];
}

/**
 * Checks each claim against the candidate's own words.
 *
 * Deliberately narrow: only terms in the technical glossary are policed, so
 * ordinary paraphrase ("they roll the pods") stays legal while an invented
 * mechanism ("termination grace period") does not.
 */
export function verifyClaims(claims: Claim[], sourceText: string): ClaimCheck[] {
  const source = normalise(sourceText);
  const terms = technicalTerms();

  return claims.map((claim) => {
    const claimText = normalise(claim.text);
    const unsupportedTerms = terms.filter(
      (term) => mentions(claimText, term) && !mentions(source, term)
    );
    return { claim, supported: unsupportedTerms.length === 0, unsupportedTerms };
  });
}

export interface ClaimFilterResult {
  kept: Claim[];
  rejected: ClaimCheck[];
}

/**
 * Drops claims that name technical terms the candidate never used, so an
 * invented fact can never enter the ledger and poison later turns.
 */
export function filterInventedClaims(
  claims: Claim[],
  sourceText: string
): ClaimFilterResult {
  const checks = verifyClaims(claims, sourceText);
  return {
    kept: checks.filter((c) => c.supported).map((c) => c.claim),
    rejected: checks.filter((c) => !c.supported),
  };
}
