import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0b1020",
        foreground: "#f8fafc",
        primary: "#8b5cf6",
        secondary: "#22c55e",
        card: "rgba(255,255,255,0.06)",
        line: "rgba(255,255,255,0.10)",
      },
      boxShadow: {
        soft: "0 20px 60px rgba(0,0,0,0.25)",
      },
      backgroundImage: {
        glow:
          "radial-gradient(circle at top, rgba(139,92,246,0.35), transparent 35%), radial-gradient(circle at 80% 20%, rgba(34,197,94,0.18), transparent 25%)",
      },
    },
  },
  plugins: [],
};

export default config;