import { isAdminRequest } from "@/lib/admin-auth";
import {
  listFitnessSessions,
  saveFitnessProgress,
} from "@/lib/fitness";

function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

function isDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return unauthorized();
  return Response.json({ sessions: await listFitnessSessions() });
}

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) return unauthorized();
  const payload = (await request.json()) as {
    practicedOn?: string;
    sessionNumber?: number;
    roundsCompleted?: number;
    durationSeconds?: number;
  };

  if (!payload.practicedOn || !isDate(payload.practicedOn)) {
    return Response.json({ error: "A valid practice date is required." }, { status: 400 });
  }
  if (
    !Number.isInteger(payload.sessionNumber) ||
    Number(payload.sessionNumber) < 1 ||
    Number(payload.sessionNumber) > 5
  ) {
    return Response.json({ error: "Session number must be between 1 and 5." }, { status: 400 });
  }
  if (
    !Number.isInteger(payload.roundsCompleted) ||
    Number(payload.roundsCompleted) < 0 ||
    Number(payload.roundsCompleted) > 10
  ) {
    return Response.json({ error: "Rounds completed must be between 0 and 10." }, { status: 400 });
  }

  const session = await saveFitnessProgress({
    practicedOn: payload.practicedOn,
    sessionNumber: Number(payload.sessionNumber),
    roundsCompleted: Number(payload.roundsCompleted),
    durationSeconds: Number(payload.durationSeconds) || 0,
  });
  return Response.json({ session });
}
