import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--ui-bg)",
        map: "var(--ui-map-bg)",
        panel: "var(--ui-panel)",
        "panel-alt": "var(--ui-panel-alt)",
        input: "var(--ui-input)",
        border: "var(--ui-border)",
        text: "var(--ui-text)",
        muted: "var(--ui-muted)",
        faint: "var(--ui-faint)",
        accent: "var(--ui-accent)",
        "accent-text": "var(--ui-accent-text)",
        land: "var(--ui-land)",
        coast: "var(--ui-coast)",
        ok: "var(--ui-ok)",
        warn: "var(--ui-warn)",
        above: "var(--ui-above)",
        danger: "var(--ui-danger)",
        low: "var(--ui-low)",
        rising: "var(--ui-rising)",
        info: "var(--ui-info)",
        alert: "var(--ui-alert)",
        earth: "var(--ui-earth)",
      },
      fontFamily: {
        sans: ["var(--ui-font)"],
      },
      borderRadius: {
        chip: "8px",
        card: "12px",
        input: "11px",
      },
      screens: {
        xs: "360px",
        sm: "600px",
        lg: "900px",
      },
      boxShadow: {
        soft: "var(--ui-shadow)",
      },
    },
  },
  corePlugins: {
    // Our base.css owns the reset — keep Tailwind from overriding tokens.
    preflight: false,
  },
  plugins: [],
};

export default config;
