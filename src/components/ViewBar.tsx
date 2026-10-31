"use client";

import { useEffect, useRef } from "react";
import { useDashboard, VIEWS } from "@/lib/dashboard";
import { Icon } from "./Icon";

export function ViewBar() {
  const { state, dispatch } = useDashboard();
  const ref = useRef<HTMLDivElement>(null);

  // keep the active segment in view when it changes (e.g. from the nav)
  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>(
      '[aria-selected="true"]',
    );
    el?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }, [state.view]);

  // first four are the "primary" tabs; the rest live in the overflow menu
  const primary = VIEWS.slice(0, 4);
  const rest = VIEWS.slice(4);
  const activeInRest = rest.find((v) => v.id === state.view);

  function onKey(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) return;
    const buttons = Array.from(
      e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
    );
    const i = buttons.findIndex((b) => b === document.activeElement);
    const next =
      e.key === "Home"
        ? buttons[0]
        : e.key === "End"
          ? buttons[buttons.length - 1]
          : buttons[
              (i + (e.key === "ArrowRight" ? 1 : buttons.length - 1)) %
                buttons.length
            ];
    next?.focus();
    next?.click();
    e.preventDefault();
  }

  return (
    <div className="viewbar ui-wrap">
      <div className="viewbar__inner">
        <span className="viewbar__label eyebrow eyebrow--muted">
          <Icon name="layers" size={13} /> Views
        </span>
        <div
          className="ui-seg viewbar__seg"
          role="tablist"
          aria-label="Dashboard views"
          onKeyDown={onKey}
        >
          {primary.map((v) => (
            <button
              key={v.id}
              type="button"
              role="tab"
              id={`tab-${v.id}`}
              aria-selected={state.view === v.id}
              aria-controls={`panel-${v.id}`}
              tabIndex={state.view === v.id ? 0 : -1}
              className="ui-seg__btn"
              onClick={() => dispatch({ type: "view", view: v.id })}
            >
              <Icon name={v.icon} />
              <span className="viewbar__long">{v.short}</span>
              <span className="viewbar__short">{v.short}</span>
            </button>
          ))}
        </div>
        <details className={`viewbar__more${activeInRest ? " is-active" : ""}`}>
          <summary className="ui-btn ui-btn--secondary ui-btn--sm">
            {activeInRest ? activeInRest.short : "More"}
            <Icon name="chevron-down" size={14} />
          </summary>
          <ul
            className="popover viewbar__more-list"
            role="menu"
            aria-label="More views"
          >
            {rest.map((v) => (
              <li key={v.id}>
                <button
                  type="button"
                  role="menuitem"
                  onClick={(e) => {
                    dispatch({ type: "view", view: v.id });
                    (
                      e.currentTarget.closest(
                        "details",
                      ) as HTMLDetailsElement | null
                    )?.removeAttribute("open");
                  }}
                >
                  <Icon name={v.icon} size={16} />
                  {v.label}
                </button>
              </li>
            ))}
          </ul>
        </details>
        <a
          className="ui-link viewbar__refresh"
          href="/data/gauges_2_view.json"
          download
        >
          <Icon name="download" size={14} /> Raw feed
        </a>
      </div>
    </div>
  );
}
