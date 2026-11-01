"use client";

import { useState } from "react";
import { useDashboard, goToView } from "@/lib/dashboard";
import { STATUS_META } from "@/lib/types";
import { Icon } from "./Icon";
import { Delta } from "./visuals";

/* --------------------- rising / ranked gauges beside hero -------------------- */
export function RankedList() {
  const { d, setSelected, records, dispatch } = useDashboard();
  const [mode, setMode] = useState<"rising" | "falling">("rising");
  const rows = mode === "rising" ? d.rising : d.falling;

  return (
    <section className="ui-card ranked" aria-labelledby="ranked-title">
      <div className="ui-card__head">
        <div>
          <span className="eyebrow eyebrow--muted">
            <Icon name="trend" size={13} /> Week on week
          </span>
          <h2 id="ranked-title" style={{ marginTop: 4 }}>
            {mode === "rising" ? "Rising gauges" : "Falling gauges"}
          </h2>
        </div>
        <Icon name="activity" size={20} className="muted" />
      </div>

      <div
        className="ui-seg ranked__seg"
        role="radiogroup"
        aria-label="Ranking direction"
      >
        <button
          type="button"
          role="radio"
          aria-checked={mode === "rising"}
          className="ui-seg__btn"
          onClick={() => setMode("rising")}
        >
          Rising
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={mode === "falling"}
          className="ui-seg__btn"
          onClick={() => setMode("falling")}
        >
          Falling
        </button>
      </div>

      <ol className="ranked__list">
        {rows.length === 0 ? (
          <li className="ranked__empty muted">
            {mode === "rising"
              ? "No gauge gained more than a point this week."
              : "No gauge lost more than a point this week."}
          </li>
        ) : null}
        {rows.map((r, i) => {
          return (
            <li key={`${r.name}-${i}`}>
              <button
                type="button"
                className="ranked__row"
                onClick={() => setSelected(r.station)}
                title={`Open ${r.name}`}
              >
                <span className="ranked__main">
                  <span className="ranked__top">
                    <span className="ranked__name">{r.name}</span>
                    <span className="ranked__value num">
                      {r.value.toFixed(1)}%
                    </span>
                  </span>
                  <span className="ranked__sub muted">{r.sub}</span>
                </span>
                <span className="ranked__side">
                  <Delta value={r.delta} />
                  <span
                    className="ranked__status"
                    style={{ color: STATUS_META[r.status].token }}
                  >
                    <span
                      className={`dot${r.status === "major" ? " dot--halo" : ""}`}
                      aria-hidden="true"
                    />
                    {STATUS_META[r.status].label}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <button
        type="button"
        className="ui-link ranked__all"
        onClick={() => goToView("stations", dispatch)}
      >
        Explore all {d.total} gauges <Icon name="arrow" size={14} />
      </button>
    </section>
  );
}

/* ------------------------------ account CTA card ---------------------------- */
export function AccountCard() {
  const [accepted, setAccepted] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <aside className="ui-card account-card" aria-labelledby="account-title">
      <span className="eyebrow">
        <Icon name="bell" size={14} /> Free account
      </span>
      <h2 id="account-title" className="account-card__title">
        Know before the water does.
      </h2>
      <p className="muted account-card__copy">
        Save watch areas, get an email the moment a gauge near you passes its
        alert line, and export the raw feed.
      </p>
      <form
        className="account-card__form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!accepted) return;
          setSent(true);
          window.dispatchEvent(
            new CustomEvent("sa-toast", {
              detail: "Check your inbox to finish creating the account.",
            }),
          );
        }}
      >
        <div className="ui-field">
          <label htmlFor="acct-name" className="ui-field__label">
            Full name
          </label>
          <input
            id="acct-name"
            className="ui-input"
            name="name"
            autoComplete="name"
            required
          />
        </div>
        <div className="ui-field">
          <label htmlFor="acct-email" className="ui-field__label">
            Email address
          </label>
          <input
            id="acct-email"
            className="ui-input"
            type="email"
            name="email"
            autoComplete="email"
            required
          />
        </div>
        <div className="ui-field">
          <label htmlFor="acct-area" className="ui-field__label">
            Watch area
          </label>
          <select
            id="acct-area"
            className="ui-select"
            name="area"
            defaultValue=""
          >
            <option value="">Any province</option>
            <option>Eastern Cape</option>
            <option>Free State</option>
            <option>Gauteng</option>
            <option>KwaZulu-Natal</option>
            <option>Limpopo</option>
            <option>Mpumalanga</option>
            <option>Northern Cape</option>
            <option>North West</option>
            <option>Western Cape</option>
          </select>
        </div>
        <label className="account-card__terms">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          />
          <span>
            I agree to the <a href="/terms">terms</a> and{" "}
            <a href="/privacy">privacy policy</a>.
          </span>
        </label>
        <button
          type="submit"
          className="ui-btn ui-btn--primary account-card__submit"
          disabled={!accepted || sent}
        >
          {sent ? "Check your inbox" : "Create free account"}
        </button>
        <p className="faint account-card__fine">
          Alerts are informational and do not replace official
          disaster-management advice.
        </p>
      </form>
    </aside>
  );
}

/* --------------------------------- ticker ---------------------------------- */
export function Ticker() {
  const { d, dataset, setSelected, records } = useDashboard();
  const items: typeof records = [];
  const seen = new Set<string>();
  for (const s of [...d.byLevel, ...d.byRain]) {
    const key = `${s.gauge}|${s.station_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(s);
    if (items.length === 14) break;
  }
  const time = dataset.last_updated_utc
    ? new Date(dataset.last_updated_utc).toLocaleTimeString("en-ZA", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
      })
    : "—";

  return (
    <div className="ticker" role="region" aria-label="Latest readings">
      <div className="ticker__inner">
        <div className="ticker__label">
          <Icon name="activity" size={15} /> Latest readings
        </div>
        <div
          className="ticker__track"
          tabIndex={0}
          aria-label="Scrollable list of latest readings"
        >
          {items.map((s, i) => (
            <button
              key={`${s.station_id}-${s.gauge}-${i}`}
              type="button"
              className="ticker__item"
              onClick={() => setSelected(s)}
            >
              <span
                className="dot"
                style={{ color: STATUS_META[s.status].token }}
                aria-hidden="true"
              />
              <span className="ticker__name">{s.gauge}</span>
              <span className="num ticker__val">
                {s.water_level.toFixed(1)}%
              </span>
              <Delta
                value={s.water_level - s.last_week_lvl}
                unit=""
                withSr={false}
              />
            </button>
          ))}
        </div>
        <span className="ticker__time faint num">{time} UTC</span>
      </div>
    </div>
  );
}
