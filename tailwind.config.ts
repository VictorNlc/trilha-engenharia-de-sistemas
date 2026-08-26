import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)",
        surface: "var(--surface)",
        surface2: "var(--surface-2)",
        ink: "var(--ink)",
        inkSoft: "var(--ink-soft)",
        inkFaint: "var(--ink-faint)",
        line: "var(--line)",
        accent: "var(--accent)",
        accentInk: "var(--accent-ink)",
        accentTint: "var(--accent-tint)",
        warm: "var(--warm)",
        warmTint: "var(--warm-tint)",
        good: "var(--good)",
        goodTint: "var(--good-tint)",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        body: ["var(--font-public-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        DEFAULT: "4px",
      },
    },
  },
  plugins: [],
};
export default config;
