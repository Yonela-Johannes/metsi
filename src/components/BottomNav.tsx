"use client";

import { useDashboard } from "@/lib/dashboard";
import { Icon } from "./Icon";

const ITEMS = [
  { id: "overview", label: "Overview", icon: "home" },
  { id: "alerts", label: "Alerts", icon: "warning" },
  { id: "map", label: "Map", icon: "pin" },
  { id: "water-level", label: "Levels", icon: "water" },
  { id: "stations", label: "Stations", icon: "table" },
  { id: "assistant", label: "Ask", icon: "sparkle" },
] as const;

export function BottomNav() {
  const { state, dispatch, d } = useDashboard();

  return (
    <nav className="bottom-nav" aria-label="Sections">
      <ul>
        {ITEMS.map((item) => {
          const active = state.view === item.id;
          return (
            <li key={item.id}>
              <button
                type="button"
                className={`bottom-nav__item${active ? " is-active" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={() => {
                  if (item.id === "assistant") {
                    window.dispatchEvent(new CustomEvent("sa-open-assistant"));
                    return;
                  }
                  dispatch({ type: "view", view: item.id });
                  document
                    .getElementById("dashboard")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                <span className="bottom-nav__icon">
                  <Icon name={item.icon} size={20} />
                  {item.id === "alerts" && d.elevated > 0 ? (
                    <span
                      className="bottom-nav__badge num"
                      aria-label={`${d.elevated} active alerts`}
                    >
                      {d.elevated > 99 ? "99+" : d.elevated}
                    </span>
                  ) : null}
                </span>
                <span className="bottom-nav__label">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
