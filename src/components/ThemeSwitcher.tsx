"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";

type Choice = "dark" | "light" | "auto";

const OPTIONS: { value: Choice; icon: string; label: string }[] = [
  { value: "dark", icon: "moon", label: "Dark" },
  { value: "light", icon: "sun", label: "Light" },
  { value: "auto", icon: "auto", label: "Auto" },
];

export function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const [choice, setChoice] = useState<Choice>("auto");

  useEffect(() => {
    const stored = localStorage.getItem("sa-theme") as Choice | null;
    if (stored === "dark" || stored === "light" || stored === "auto")
      setChoice(stored);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const apply = () => {
      const dark = choice === "auto" ? !mq.matches : choice === "dark";
      document.documentElement.setAttribute(
        "data-theme",
        dark ? "dark" : "light",
      );
      document.documentElement.setAttribute("data-theme-choice", choice);
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", dark ? "#0a172e" : "#eef3fa");
    };
    apply();
    if (choice === "auto") {
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [choice]);

  function pick(value: Choice) {
    setChoice(value);
    localStorage.setItem("sa-theme", value);
  }

  return (
    <div
      className={`theme-switch${compact ? " theme-switch--compact" : ""}`}
      role="radiogroup"
      aria-label="Colour theme"
    >
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={choice === o.value}
          className="theme-switch__btn"
          onClick={() => pick(o.value)}
          title={`${o.label} theme`}
        >
          <Icon name={o.icon} size={15} />
          <span className={compact ? "sr" : undefined}>{o.label}</span>
        </button>
      ))}
    </div>
  );
}
