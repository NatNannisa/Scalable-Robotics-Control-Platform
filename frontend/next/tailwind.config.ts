import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#050914",
        panel: "#0a1020",
        panel2: "#10182a",
        line: "#1d2c48",
        cyan: "#35d5ff",
        green: "#31e981",
        amber: "#f6b743",
        danger: "#ff4d67",
        purple: "#9c6cff"
      },
      boxShadow: {
        glow: "0 0 28px rgba(53, 213, 255, 0.22)",
        danger: "0 0 30px rgba(255, 77, 103, 0.28)",
        live: "0 0 22px rgba(49, 233, 129, 0.25)"
      }
    }
  },
  plugins: []
};

export default config;
