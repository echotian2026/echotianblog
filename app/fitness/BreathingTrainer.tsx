"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FitnessSession } from "@/lib/fitness";

type Phase = "ready" | "inhale" | "exhale" | "complete";

const ROUNDS_PER_SESSION = 10;
const SESSIONS_PER_DAY = 5;
const INHALE_MS = 4_000;
const EXHALE_MS = 10_000;
const COUNTDOWN = "Ten. Nine. Eight. Seven. Six. Five. Four. Three. Two. One.";

function localDay(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function dayLabel(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(year, month - 1, day));
}

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

export function BreathingTrainer() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [sessions, setSessions] = useState<FitnessSession[]>([]);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<Phase>("ready");
  const [round, setRound] = useState(0);
  const [sessionNumber, setSessionNumber] = useState(1);
  const [voiceOn, setVoiceOn] = useState(true);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const runTokenRef = useRef(0);
  const startedAtRef = useRef(0);
  const lastSavedRoundRef = useRef(0);
  const today = localDay();

  const loadSessions = useCallback(async () => {
    const response = await fetch("/api/admin/fitness", { cache: "no-store" });
    if (response.status === 401) {
      setAuthenticated(false);
      return;
    }
    const data = (await response.json()) as {
      sessions?: FitnessSession[];
      error?: string;
    };
    if (!response.ok) throw new Error(data.error ?? "Could not load your practice history.");
    setAuthenticated(true);
    setSessions(data.sessions ?? []);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSessions().catch(() => {
        setAuthenticated(false);
        setMessage("Your practice history could not be loaded.");
      });
    }, 0);
    return () => {
      window.clearTimeout(timer);
      runTokenRef.current += 1;
      window.speechSynthesis?.cancel();
    };
  }, [loadSessions]);

  const todaySessions = useMemo(
    () =>
      sessions
        .filter((session) => session.practicedOn === today)
        .sort((a, b) => a.sessionNumber - b.sessionNumber),
    [sessions, today]
  );

  const completedToday = todaySessions.filter(
    (session) => session.roundsCompleted === ROUNDS_PER_SESSION
  ).length;

  const currentSavedSession =
    todaySessions.find(
      (session) =>
        session.roundsCompleted > 0 &&
        session.roundsCompleted < ROUNDS_PER_SESSION
    ) ?? null;

  const suggestedSessionNumber = Math.min(
    currentSavedSession?.sessionNumber ?? completedToday + 1,
    SESSIONS_PER_DAY
  );
  const suggestedRound = currentSavedSession?.roundsCompleted ?? 0;
  const displaySessionNumber =
    running || phase === "complete" ? sessionNumber : suggestedSessionNumber;
  const displayRound =
    running || phase === "complete" ? round : suggestedRound;

  function speak(text: string) {
    if (!voiceOn || !("speechSynthesis" in window)) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      utterance.voice =
        voices.find((voice) => /Samantha|Google UK English Female/i.test(voice.name)) ??
        voices.find((voice) => voice.lang.startsWith("en")) ??
        null;
      utterance.lang = "en-US";
      utterance.rate = 0.82;
      utterance.pitch = 1;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  }

  async function saveRound(
    targetSession: number,
    roundsCompleted: number,
    durationSeconds: number
  ) {
    if (!authenticated) return;
    setSaving(true);
    try {
      const response = await fetch("/api/admin/fitness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          practicedOn: today,
          sessionNumber: targetSession,
          roundsCompleted,
          durationSeconds,
        }),
      });
      const data = (await response.json()) as {
        session?: FitnessSession;
        error?: string;
      };
      if (!response.ok || !data.session) {
        throw new Error(data.error ?? "Progress could not be saved.");
      }
      setSessions((current) => [
        ...current.filter((session) => session.id !== data.session?.id),
        data.session as FitnessSession,
      ]);
    } finally {
      setSaving(false);
    }
  }

  async function startPractice() {
    if (running || completedToday >= SESSIONS_PER_DAY) return;
    const token = ++runTokenRef.current;
    const targetSession =
      currentSavedSession?.sessionNumber ?? Math.min(completedToday + 1, SESSIONS_PER_DAY);
    const startRound = currentSavedSession?.roundsCompleted ?? 0;

    setMessage("");
    setRunning(true);
    setPhase("ready");
    setSessionNumber(targetSession);
    setRound(startRound);
    lastSavedRoundRef.current = startRound;
    startedAtRef.current = Date.now();
    window.speechSynthesis?.cancel();
    await speak(`Session ${targetSession}. Let's begin.`);
    if (token !== runTokenRef.current) return;

    try {
      for (
        let currentRound = startRound + 1;
        currentRound <= ROUNDS_PER_SESSION;
        currentRound += 1
      ) {
        if (token !== runTokenRef.current) return;
        setRound(currentRound);
        setPhase("inhale");
        await Promise.all([
          speak(`Round ${currentRound}. Breathe in.`),
          wait(INHALE_MS),
        ]);
        if (token !== runTokenRef.current) return;

        setPhase("exhale");
        await Promise.all([
          speak(`Breathe out slowly. ${COUNTDOWN}`),
          wait(EXHALE_MS),
        ]);
        if (token !== runTokenRef.current) return;

        const elapsed = Math.round((Date.now() - startedAtRef.current) / 1000);
        await saveRound(targetSession, currentRound, elapsed);
        lastSavedRoundRef.current = currentRound;
        if (token !== runTokenRef.current) return;
        if (currentRound < ROUNDS_PER_SESSION) await wait(700);
      }

      setPhase("complete");
      await speak("Session complete. Well done.");
      setMessage(
        authenticated
          ? "Session complete — your progress was saved automatically."
          : "Session complete. Sign in as admin next time to save your progress."
      );
    } catch (error) {
      setPhase("ready");
      setMessage(
        error instanceof Error ? error.message : "The session stopped unexpectedly."
      );
    } finally {
      if (token === runTokenRef.current) setRunning(false);
    }
  }

  function stopPractice() {
    runTokenRef.current += 1;
    window.speechSynthesis?.cancel();
    setRunning(false);
    setPhase("ready");
    setMessage(
      authenticated && lastSavedRoundRef.current > 0
        ? `Paused after round ${lastSavedRoundRef.current}. Completed rounds have been saved.`
        : "Practice stopped."
    );
  }

  const historyDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, offset) => {
      const date = new Date();
      date.setDate(date.getDate() - offset);
      const key = localDay(date);
      const daySessions = sessions.filter((session) => session.practicedOn === key);
      return {
        key,
        sessions: Array.from({ length: SESSIONS_PER_DAY }, (_, index) =>
          daySessions.find((session) => session.sessionNumber === index + 1)
        ),
      };
    });
  }, [sessions]);

  const phaseCopy =
    phase === "inhale"
      ? "Breathe in"
      : phase === "exhale"
        ? "Breathe out slowly"
        : phase === "complete"
          ? "Well done"
          : "Ready when you are";

  return (
    <div className="fitness-page">
      <header className="fitness-heading">
        <p className="eyebrow">My fitness</p>
        <h1>Breathing practice</h1>
        <p>
          Ten guided rounds make one session. Aim for five gentle sessions each day.
        </p>
      </header>

      <section className="breathing-card" aria-live="polite">
        <div className="breathing-status-row">
          <span>Session {displaySessionNumber} of {SESSIONS_PER_DAY}</span>
          <span>Round {displayRound} of {ROUNDS_PER_SESSION}</span>
        </div>

        <div className={`breathing-orb ${phase}`} aria-hidden="true">
          <div className="breathing-orb-core" />
        </div>

        <div className="breathing-phase">
          <strong>{phaseCopy}</strong>
          <span>
            {phase === "inhale"
              ? "Let the breath arrive gently."
              : phase === "exhale"
                ? "Relax your shoulders as you count down."
                : "Sit comfortably and keep the breath easy."}
          </span>
        </div>

        <div className="breathing-controls">
          {running ? (
            <button type="button" className="secondary-button" onClick={stopPractice}>
              Stop for now
            </button>
          ) : (
            <button
              type="button"
              className="primary-button"
              onClick={() => void startPractice()}
              disabled={completedToday >= SESSIONS_PER_DAY}
            >
              {completedToday >= SESSIONS_PER_DAY
                ? "Today’s practice is complete"
                : currentSavedSession
                  ? `Resume session ${currentSavedSession.sessionNumber}`
                  : `Start session ${completedToday + 1}`}
            </button>
          )}
          <button
            type="button"
            className={`voice-toggle ${voiceOn ? "active" : ""}`}
            onClick={() => {
              window.speechSynthesis?.cancel();
              setVoiceOn((value) => !value);
            }}
            disabled={running}
            aria-pressed={voiceOn}
          >
            {voiceOn ? "Voice on" : "Voice off"}
          </button>
        </div>

        <p className="breathing-note">
          Stay seated and breathe comfortably. Stop if you feel dizzy or unwell.
        </p>
        {message && <p className="fitness-message">{message}</p>}
      </section>

      <section className="fitness-progress">
        <div className="fitness-section-title">
          <div>
            <p className="eyebrow">Today</p>
            <h2>{completedToday} of {SESSIONS_PER_DAY} sessions</h2>
          </div>
          {saving && <span>Saving…</span>}
        </div>
        <div className="session-dots" aria-label={`${completedToday} of 5 sessions complete`}>
          {Array.from({ length: SESSIONS_PER_DAY }, (_, index) => {
            const saved = todaySessions.find(
              (session) => session.sessionNumber === index + 1
            );
            const complete = saved?.roundsCompleted === ROUNDS_PER_SESSION;
            const partial = Boolean(saved && saved.roundsCompleted > 0 && !complete);
            return (
              <span
                key={index}
                className={complete ? "complete" : partial ? "partial" : ""}
                title={
                  complete
                    ? `Session ${index + 1} complete`
                    : partial
                      ? `Session ${index + 1}: ${saved?.roundsCompleted} rounds`
                      : `Session ${index + 1} not started`
                }
              />
            );
          })}
        </div>

        {authenticated === false && (
          <p className="fitness-auth-note">
            The trainer is ready to use. <Link href="/admin" className="inline-link">
              Sign in as admin
            </Link>{" "}
            to save and view your private practice history.
          </p>
        )}
      </section>

      {authenticated && (
        <section className="fitness-history">
          <div className="fitness-section-title">
            <div>
              <p className="eyebrow">History</p>
              <h2>Last seven days</h2>
            </div>
          </div>
          <ul>
            {historyDays.map((day) => (
              <li key={day.key}>
                <time dateTime={day.key}>{dayLabel(day.key)}</time>
                <div className="history-dots">
                  {day.sessions.map((session, index) => (
                    <span
                      key={index}
                      className={
                        session?.roundsCompleted === ROUNDS_PER_SESSION
                          ? "complete"
                          : session?.roundsCompleted
                            ? "partial"
                            : ""
                      }
                    />
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
