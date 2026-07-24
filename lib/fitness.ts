import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export type FitnessSession = {
  id: string;
  practicedOn: string;
  sessionNumber: number;
  roundsCompleted: number;
  durationSeconds: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type FitnessSessionRow = {
  id: string;
  practiced_on: string;
  session_number: number;
  rounds_completed: number;
  duration_seconds: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

function fromRow(row: FitnessSessionRow): FitnessSession {
  return {
    id: row.id,
    practicedOn: row.practiced_on,
    sessionNumber: row.session_number,
    roundsCompleted: row.rounds_completed,
    durationSeconds: row.duration_seconds,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listFitnessSessions(days = 30) {
  const start = new Date();
  start.setDate(start.getDate() - Math.max(1, Math.min(days, 90)));
  const startDate = start.toISOString().slice(0, 10);

  const { data, error } = await getSupabaseAdmin()
    .from("fitness_sessions")
    .select("*")
    .gte("practiced_on", startDate)
    .order("practiced_on", { ascending: false })
    .order("session_number", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as FitnessSessionRow[]).map(fromRow);
}

export async function saveFitnessProgress(input: {
  practicedOn: string;
  sessionNumber: number;
  roundsCompleted: number;
  durationSeconds: number;
}) {
  const roundsCompleted = Math.max(0, Math.min(10, input.roundsCompleted));
  const now = new Date().toISOString();
  const { data, error } = await getSupabaseAdmin()
    .from("fitness_sessions")
    .upsert(
      {
        practiced_on: input.practicedOn,
        session_number: input.sessionNumber,
        rounds_completed: roundsCompleted,
        duration_seconds: Math.max(0, input.durationSeconds),
        completed_at: roundsCompleted === 10 ? now : null,
        updated_at: now,
      },
      { onConflict: "practiced_on,session_number" }
    )
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return fromRow(data as FitnessSessionRow);
}
