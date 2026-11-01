"use client";

import { useEffect, useRef, useState } from "react";
import { useDashboard } from "@/lib/dashboard";
import { Icon } from "./Icon";

type Msg = { role: "bot" | "user"; text: string };

const LIMIT = 500;

/** Rule-based answers grounded in the live dataset — no external model call. */
function answer(q: string, d: ReturnType<typeof useDashboard>["d"]): string {
  const t = q.toLowerCase();
  const empty =
    "There is no station reading loaded right now, so I can't summarise levels. Try refreshing the data.";
  if (!d.maxWater) return empty;
  if (/(highest|peak|fullest|max)/.test(t)) {
    const s = d.maxWater;
    return `${s.gauge} in ${s.basin} is the fullest gauge at ${s.water_level.toFixed(1)}% of capacity (${s.river}).`;
  }
  if (/rain/.test(t)) {
    if (!d.rainReporters || !d.maxRain)
      return "No station reported measurable rain in the last 24 hours.";
    const s = d.maxRain;
    return `Heaviest 24-hour rainfall is ${s.rain_fall.toFixed(1)} mm at ${s.gauge}. ${d.rainReporters} gauges reported some rain.`;
  }
  if (/(alert|flood|warning|danger)/.test(t)) {
    return `${d.counts.major} major, ${d.counts.minor} minor and ${d.counts.alert} alert-level gauges right now — ${d.elevated} of ${d.total} in total. The flood alert tab lists each one.`;
  }
  if (/(rising|increase|up|climb)/.test(t)) {
    const r = d.rising[0];
    return r
      ? `${d.risingCount} gauges rose week on week. The steepest is ${r.name} at +${r.delta.toFixed(1)} points.`
      : "No gauge rose more than a point compared with last week.";
  }
  if (/(basin|province|region)/.test(t)) {
    const b = d.basins[0];
    return b
      ? `${b.name} holds the most stations (${b.stations}, ${b.share}% of coverage), with ${b.elevated} above the alert line.`
      : empty;
  }
  if (/(threshold|80|100|110|class)/.test(t)) {
    return "A gauge is “alert” from 80% of full storage capacity, “minor flood” from 100% and “major flood” from 110%.";
  }
  return `I can summarise peak levels, rainfall, rising gauges, provincial coverage and thresholds from the latest ${d.total}-gauge reading.`;
}

export function Assistant() {
  const { d } = useDashboard();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [log, setLog] = useState<Msg[]>([
    {
      role: "bot",
      text: "Hi — ask me about current dam levels, rainfall or which gauges are rising.",
    },
  ]);
  const [used, setUsed] = useState(1);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const openHandler = () => setOpen(true);
    window.addEventListener("sa-open-assistant", openHandler);
    return () => window.removeEventListener("sa-open-assistant", openHandler);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function send(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    setLog((l) => [
      ...l,
      { role: "user", text: q },
      { role: "bot", text: answer(q, d) },
    ]);
    setValue("");
    setUsed((u) => Math.min(10, u + 1));
  }

  const pctUsed = (used / 10) * 100;

  return (
    <>
      <button
        ref={fabRef}
        type="button"
        className={`assistant-fab${open ? " is-hidden" : ""}`}
        aria-expanded={open}
        aria-controls="assistant-panel"
        onClick={() => setOpen(true)}
      >
        <span className="assistant-fab__mascot" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="26" height="26">
            <path
              d="M16 4c6 6.6 9.5 11.2 9.5 16a9.5 9.5 0 0 1-19 0C6.5 15.2 10 10.6 16 4Z"
              fill="currentColor"
            />
            <circle cx="12.6" cy="19" r="1.7" fill="var(--ui-accent-text)" />
            <circle cx="19.4" cy="19" r="1.7" fill="var(--ui-accent-text)" />
          </svg>
        </span>
        <span className="assistant-fab__label">Ask Metsi</span>
      </button>

      {open ? (
        <div
          ref={panelRef}
          id="assistant-panel"
          className="assistant"
          role="dialog"
          aria-labelledby="assistant-title"
        >
          <header className="assistant__head">
            <span className="assistant__avatar" aria-hidden="true">
              <svg viewBox="0 0 32 32" width="22" height="22">
                <path
                  d="M16 4c6 6.6 9.5 11.2 9.5 16a9.5 9.5 0 0 1-19 0C6.5 15.2 10 10.6 16 4Z"
                  fill="currentColor"
                />
                <circle
                  cx="12.6"
                  cy="19"
                  r="1.7"
                  fill="var(--ui-accent-text)"
                />
                <circle
                  cx="19.4"
                  cy="19"
                  r="1.7"
                  fill="var(--ui-accent-text)"
                />
              </svg>
            </span>
            <div className="assistant__id">
              <strong id="assistant-title">Metsi assistant</strong>
              <span className="faint">
                beta · answers from the latest DWS reading
              </span>
            </div>
            <button
              type="button"
              className="icon-btn"
              aria-label="Start a new conversation"
              onClick={() =>
                setLog([
                  {
                    role: "bot",
                    text: "Fresh start. Ask about dam levels, rainfall or rising gauges.",
                  },
                ])
              }
            >
              <Icon name="refresh" size={17} />
            </button>
            <button
              type="button"
              className="icon-btn"
              aria-label="Close assistant"
              onClick={() => setOpen(false)}
            >
              <Icon name="close" size={17} />
            </button>
          </header>

          <div className="assistant__log" role="log" aria-live="polite">
            {log.map((m, i) => (
              <p key={i} className={`assistant__msg assistant__msg--${m.role}`}>
                {m.text}
              </p>
            ))}
          </div>

          <div className="assistant__usage">
            <span className="faint">Questions this session</span>
            <span className="assistant__usage-bar">
              <span style={{ width: `${pctUsed}%` }} />
            </span>
            <span className="num faint">{used}/10</span>
          </div>

          <form className="assistant__form" onSubmit={send}>
            <label htmlFor="assistant-input" className="sr">
              Ask a question about the readings
            </label>
            <textarea
              id="assistant-input"
              ref={inputRef}
              className="assistant__input"
              rows={2}
              maxLength={LIMIT}
              value={value}
              placeholder="Which gauges are rising fastest?"
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(e);
                }
              }}
            />
            <button
              type="submit"
              className="assistant__send"
              aria-label="Send question"
              disabled={!value.trim()}
            >
              <Icon name="send" size={17} />
            </button>
          </form>
          <div className="assistant__meta">
            <span className="faint num">
              {value.length}/{LIMIT}
            </span>
            <span className="faint">
              Informational only — not official disaster advice.
            </span>
          </div>
        </div>
      ) : null}
    </>
  );
}
