import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import ws from "ws";

import type {
  Blueprint,
  Candidate,
  Claim,
  Feedback,
  Session,
  SessionState,
  Turn,
  TurnRubric,
} from "./types";

/**
 * The Supabase client is a stateless HTTP client, safe to hold at module
 * scope. SESSION state is what must never live in memory — every helper
 * below takes a sessionId and round-trips through Postgres.
 */
let client: SupabaseClient | null = null;

function db(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    // supabase-js builds a Realtime client eagerly and Node < 22 has no
    // global WebSocket. We never use realtime, but the constructor still
    // runs, so give it a transport rather than let it throw.
    realtime: { transport: ws as unknown as never },
  });
  return client;
}

interface SessionRow {
  id: string;
  candidate: Candidate;
  blueprint: Blueprint | null;
  state: SessionState | null;
  status: string;
  created_at: string;
}

interface TurnRow {
  session_id: string;
  turn_number: number;
  role: string;
  content: string;
  target_day: number | null;
  depth: number | null;
  rubric: TurnRubric | null;
  claims: Claim[] | null;
  rationale: string | null;
}

const EMPTY_STATE: SessionState = {
  questionCount: 0,
  daysCovered: [],
  currentDay: 0,
  currentDepth: 2,
  followUpCount: 0,
  followUpAllowance: 3,
  abilityEstimate: 3,
  mode: "normal",
  consecutiveWeak: 0,
};

export async function createSession(
  sessionId: string,
  candidate: Candidate,
  blueprint: Blueprint | null
): Promise<Session> {
  const { data, error } = await db()
    .from("sessions")
    .insert({
      id: sessionId,
      candidate,
      blueprint,
      state: EMPTY_STATE,
      status: "active",
    })
    .select()
    .single();

  if (error) throw new Error(`createSession(${sessionId}): ${error.message}`);
  return toSession(data as SessionRow);
}

/** Returns null when the session does not exist. Never throws. */
export async function loadSession(sessionId: string): Promise<Session | null> {
  try {
    const { data, error } = await db()
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle();

    if (error || !data) return null;
    return toSession(data as SessionRow);
  } catch {
    return null;
  }
}

export async function saveSessionState(
  sessionId: string,
  state: SessionState
): Promise<void> {
  const { error } = await db()
    .from("sessions")
    .update({ state })
    .eq("id", sessionId);

  if (error) throw new Error(`saveSessionState(${sessionId}): ${error.message}`);
}

/**
 * Appends a turn. When turnNumber is omitted the next number is derived from
 * the table, so callers never have to hold a counter in memory.
 */
export async function appendTurn(
  sessionId: string,
  turn: Omit<Turn, "turnNumber"> & { turnNumber?: number }
): Promise<void> {
  const turnNumber = turn.turnNumber ?? (await nextTurnNumber(sessionId));

  const row: TurnRow = {
    session_id: sessionId,
    turn_number: turnNumber,
    role: turn.role,
    content: turn.content,
    target_day: turn.targetDay ?? null,
    depth: turn.depth ?? null,
    rubric: turn.rubric ?? null,
    claims: turn.claims ?? [],
    rationale: turn.rationale ?? null,
  };

  const { error } = await db().from("turns").insert(row);
  if (error) throw new Error(`appendTurn(${sessionId}): ${error.message}`);
}

async function nextTurnNumber(sessionId: string): Promise<number> {
  const { data } = await db()
    .from("turns")
    .select("turn_number")
    .eq("session_id", sessionId)
    .order("turn_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const last = (data as { turn_number: number } | null)?.turn_number ?? 0;
  return last + 1;
}

/**
 * The last n turns in chronological order — NOT the full transcript.
 * Everything earlier is summarised by the claim ledger (CLAUDE.md).
 */
export async function getRecentTurns(
  sessionId: string,
  n = 4
): Promise<Turn[]> {
  const { data, error } = await db()
    .from("turns")
    .select("*")
    .eq("session_id", sessionId)
    .order("turn_number", { ascending: false })
    .limit(n);

  if (error) throw new Error(`getRecentTurns(${sessionId}): ${error.message}`);

  return ((data ?? []) as TurnRow[]).map(toTurn).reverse();
}

/** Every claim from every turn, flattened in turn order. */
export async function getClaimLedger(sessionId: string): Promise<Claim[]> {
  const { data, error } = await db()
    .from("turns")
    .select("claims")
    .eq("session_id", sessionId)
    .order("turn_number", { ascending: true });

  if (error) throw new Error(`getClaimLedger(${sessionId}): ${error.message}`);

  return ((data ?? []) as { claims: Claim[] | null }[]).flatMap(
    (r) => r.claims ?? []
  );
}

export async function saveReport(
  sessionId: string,
  feedback: Feedback
): Promise<void> {
  const { error } = await db()
    .from("reports")
    .upsert({ session_id: sessionId, feedback }, { onConflict: "session_id" });

  if (error) throw new Error(`saveReport(${sessionId}): ${error.message}`);
}

export async function markDone(sessionId: string): Promise<void> {
  const { error } = await db()
    .from("sessions")
    .update({ status: "done" })
    .eq("id", sessionId);

  if (error) throw new Error(`markDone(${sessionId}): ${error.message}`);
}

function toSession(row: SessionRow): Session {
  return {
    id: row.id,
    candidate: row.candidate,
    blueprint: row.blueprint,
    state: row.state ?? { ...EMPTY_STATE },
    status: row.status === "done" ? "done" : "active",
    createdAt: row.created_at,
  };
}

function toTurn(row: TurnRow): Turn {
  return {
    turnNumber: row.turn_number,
    role: row.role === "candidate" ? "candidate" : "interviewer",
    content: row.content,
    targetDay: row.target_day,
    depth: row.depth,
    rubric: row.rubric,
    claims: row.claims ?? [],
    rationale: row.rationale,
  };
}
